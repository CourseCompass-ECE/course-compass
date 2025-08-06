from dotenv import load_dotenv
import tensorflow as tf
import os
import requests
import json
from sentence_transformers import SentenceTransformer
from constants import PADDING_VALUE, MAX_SKILLS_INTERESTS_LENGTH, MAX_MINORS_CERTIFICATES_LENGTH, TFRECORD_FILE_PATH, BATCH_SIZE
import numpy as np

def convertIntListToIntFeature(value):
    return tf.train.Feature(int64_list=tf.train.Int64List(value=value))

def convertFloatListToFloatFeature(value):
    return tf.train.Feature(float_list=tf.train.FloatList(value=value))

def convertFeatureObjectToExampleObject(features):
    return tf.train.Example(features=tf.train.Features(feature=features))

def addPadding(maxLength, listToPad):
    return listToPad + [PADDING_VALUE] * (maxLength - len(listToPad)) 

def findSkillsInterestsLists(datapoint, userOrCourseFeatures):
    skillsInterestsIds = [skillInterestObject["id"] for skillInterestObject in datapoint[userOrCourseFeatures]["skillsInterests"]]
    skillsInterestsIds = addPadding(MAX_SKILLS_INTERESTS_LENGTH, skillsInterestsIds)
    skillsInterestsSkillOrInterest = [skillInterestObject["skillOrInterest"] for skillInterestObject in datapoint[userOrCourseFeatures]["skillsInterests"]]
    skillsInterestsSkillOrInterest = addPadding(MAX_SKILLS_INTERESTS_LENGTH, skillsInterestsSkillOrInterest)
    skillsInterestsIsSpecific = [skillInterestObject["isSpecific"] for skillInterestObject in datapoint[userOrCourseFeatures]["skillsInterests"]]
    skillsInterestsIsSpecific = addPadding(MAX_SKILLS_INTERESTS_LENGTH, skillsInterestsIsSpecific)

    return skillsInterestsIds, skillsInterestsSkillOrInterest, skillsInterestsIsSpecific

def findMinorsCertificatesLists(datapoint, userOrCourseFeatures):
    minorsCertificatesIds = [minorCertificateObject["id"] for minorCertificateObject in datapoint[userOrCourseFeatures]["minorsCertificates"]]
    minorsCertificatesIds = addPadding(MAX_MINORS_CERTIFICATES_LENGTH, minorsCertificatesIds)
    minorsCertificatesMinorOrCertificate = [minorCertificateObject["minorOrCertificate"] for minorCertificateObject in datapoint[userOrCourseFeatures]["minorsCertificates"]]
    minorsCertificatesMinorOrCertificate = addPadding(MAX_MINORS_CERTIFICATES_LENGTH, minorsCertificatesMinorOrCertificate)
    

    return minorsCertificatesIds, minorsCertificatesMinorOrCertificate

def createTfRecordEntry(datapoint, stringEmbeddingModel):
    userSkillsInterestsIds, userSkillsInterestsSkillOrInterest, userSkillsInterestsIsSpecific = findSkillsInterestsLists(datapoint, "userFeatures")
    userMinorsCertificatesIds, userMinorsCertificatesMinorOrCertificate = findMinorsCertificatesLists(datapoint, "userFeatures")
    userLearningGoals = stringEmbeddingModel.encode(datapoint["userFeatures"]["learningGoal"])

    courseSkillsInterestsIds, courseSkillsInterestsSkillOrInterest, courseSkillsInterestsIsSpecific = findSkillsInterestsLists(datapoint, "courseFeatures")
    courseMinorsCertificatesIds, courseMinorsCertificatesMinorOrCertificate = findMinorsCertificatesLists(datapoint, "courseFeatures")
    courseTitle = stringEmbeddingModel.encode(datapoint["courseFeatures"]["title"])
    courseDescription = stringEmbeddingModel.encode(datapoint["courseFeatures"]["description"])

    features = {
        "userSkillsInterestsIds": convertIntListToIntFeature(userSkillsInterestsIds),
        "userSkillsInterestsSkillOrInterest": convertIntListToIntFeature(userSkillsInterestsSkillOrInterest),
        "userSkillsInterestsIsSpecific": convertIntListToIntFeature(userSkillsInterestsIsSpecific),
        "userEceAreas": convertFloatListToFloatFeature(datapoint["userFeatures"]["eceAreas"]),
        "userDesiredDesignation": convertFloatListToFloatFeature(datapoint["userFeatures"]["desiredDesignation"]),
        "userMinorsCertificatesIds": convertIntListToIntFeature(userMinorsCertificatesIds),
        "userMinorsCertificatesMinorOrCertificate": convertIntListToIntFeature(userMinorsCertificatesMinorOrCertificate),
        "userLearningGoals": convertFloatListToFloatFeature(userLearningGoals.flatten().tolist()),
        "userLearningGoalsCount": convertIntListToIntFeature([len(datapoint["userFeatures"]["learningGoal"])]),

        "courseSkillsInterestsIds": convertIntListToIntFeature(courseSkillsInterestsIds),
        "courseSkillsInterestsSkillOrInterest": convertIntListToIntFeature(courseSkillsInterestsSkillOrInterest),
        "courseSkillsInterestsIsSpecific": convertIntListToIntFeature(courseSkillsInterestsIsSpecific),
        "courseMinorsCertificatesIds": convertIntListToIntFeature(courseMinorsCertificatesIds),
        "courseMinorsCertificatesMinorOrCertificate": convertIntListToIntFeature(courseMinorsCertificatesMinorOrCertificate),
        "courseTitle": convertFloatListToFloatFeature(courseTitle.tolist()),
        "courseDescription": convertFloatListToFloatFeature(courseDescription.tolist()),
        "courseEceAreas": convertFloatListToFloatFeature(datapoint["courseFeatures"]["eceAreas"]),

        "label": convertIntListToIntFeature([datapoint["label"]]),
        "weight": convertFloatListToFloatFeature([datapoint["weight"]]),
    }

    return convertFeatureObjectToExampleObject(features)

if __name__ == '__main__':
    load_dotenv()
    url = os.getenv("FETCH_RAW_DATA_ENDPOINT")

    try:
        response = requests.get(url)
        response.raise_for_status()

        if (response.ok):
            data = json.loads(response.content)
            datapoints = []
            stringEmbeddingModel = SentenceTransformer("all-MiniLM-L6-v2")
            
            for datapoint in data["cleansedData"]:
                datapoints.append(createTfRecordEntry(datapoint, stringEmbeddingModel))

            with tf.io.TFRecordWriter(TFRECORD_FILE_PATH) as writer:
                for datapoint in datapoints:
                    writer.write(datapoint.SerializeToString())

    except requests.exceptions.RequestException as error:
        raise SystemExit(error)