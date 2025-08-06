from fastapi import FastAPI
import tensorflow as tf
from constants import MODEL_FILE_PATH, MAX_RECOMMENDED_COURSES
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer
from generateTrainingData import findSkillsInterestsLists, findMinorsCertificatesLists
from dotenv import load_dotenv
import os
import requests
import json

app = FastAPI()

class SkillInterest(BaseModel):
    id: int
    skillOrInterest: int
    isSpecific: int

class MinorCertificate(BaseModel):
    id: int
    minorOrCertificate: int

class UserFeatures(BaseModel):
    skillsInterests: List[SkillInterest]
    eceAreas: List[int]
    desiredDesignation: List[int]
    minorsCertificates: List[MinorCertificate]
    learningGoal: List[str]

class CourseFeatures(BaseModel):
    description: str
    title: str
    eceAreas: List[int]
    skillsInterests: List[SkillInterest]
    minorsCertificates: List[MinorCertificate]

class UserCourseData(BaseModel):
    userId: int
    userFeatures: UserFeatures
    courseId: int
    courseFeatures: CourseFeatures

class UserCourseDataList(BaseModel):
    userCourseDataList: List[UserCourseData]

def convertDatapointToTensors(datapoint, stringEmbeddingModel):
    userSkillsInterestsIds, userSkillsInterestsSkillOrInterest, userSkillsInterestsIsSpecific = findSkillsInterestsLists(datapoint, "userFeatures")
    userMinorsCertificatesIds, userMinorsCertificatesMinorOrCertificate = findMinorsCertificatesLists(datapoint, "userFeatures")
    userLearningGoals = stringEmbeddingModel.encode(datapoint["userFeatures"]["learningGoal"])

    courseSkillsInterestsIds, courseSkillsInterestsSkillOrInterest, courseSkillsInterestsIsSpecific = findSkillsInterestsLists(datapoint, "courseFeatures")
    courseMinorsCertificatesIds, courseMinorsCertificatesMinorOrCertificate = findMinorsCertificatesLists(datapoint, "courseFeatures")
    courseTitle = stringEmbeddingModel.encode(datapoint["courseFeatures"]["title"])
    courseDescription = stringEmbeddingModel.encode(datapoint["courseFeatures"]["description"])

    userCourseFeatures = {
        "userSkillsInterestsIds": tf.constant(userSkillsInterestsIds, dtype=tf.int64),
        "userSkillsInterestsSkillOrInterest": tf.constant(userSkillsInterestsSkillOrInterest, dtype=tf.int64),
        "userSkillsInterestsIsSpecific": tf.constant(userSkillsInterestsIsSpecific, dtype=tf.int64),
        "userMinorsCertificatesIds": tf.constant(userMinorsCertificatesIds, dtype=tf.int64),
        "userMinorsCertificatesMinorOrCertificate": tf.constant(userMinorsCertificatesMinorOrCertificate, dtype=tf.int64),
        "userEceAreas": tf.constant(datapoint["userFeatures"]["eceAreas"], dtype=tf.float32),
        "userDesiredDesignation": tf.constant(datapoint["userFeatures"]["desiredDesignation"], dtype=tf.float32),
        "courseSkillsInterestsIds": tf.constant(courseSkillsInterestsIds, dtype=tf.int64),
        "courseSkillsInterestsSkillOrInterest": tf.constant(courseSkillsInterestsSkillOrInterest, dtype=tf.int64),
        "courseSkillsInterestsIsSpecific": tf.constant(courseSkillsInterestsIsSpecific, dtype=tf.int64),
        "courseMinorsCertificatesIds": tf.constant(courseMinorsCertificatesIds, dtype=tf.int64),
        "courseMinorsCertificatesMinorOrCertificate": tf.constant(courseMinorsCertificatesMinorOrCertificate, dtype=tf.int64),
        "courseTitle": tf.constant(courseTitle, dtype=tf.float32),
        "courseDescription": tf.constant(courseDescription, dtype=tf.float32),
        "courseEceAreas": tf.constant(datapoint["courseFeatures"]["eceAreas"], dtype=tf.float32),
        "userLearningGoals": tf.constant(userLearningGoals, dtype=tf.float32),
    }

    return userCourseFeatures

def topRecommendedCourses(userId, predictedRecommendationScores, courseIdsList):
    load_dotenv()
    url = os.getenv("FETCH_TOP_COURSES_ENDPOINT")
    payload = {
        "userId": userId,
        "scores": predictedRecommendationScores,
        "courseIds": courseIdsList,
        "maxScores": MAX_RECOMMENDED_COURSES
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()

        if (response.ok):
            return json.loads(response.content)["recommendedCourses"]

    except requests.exceptions.RequestException as error:
        raise SystemExit(error)

# Workflow: generate/store tokenized data points, convert to tensors, shuffle & batch them, then for each batch:
# find embeddings for each course/user, find similarity, compute overall loss, train via backpropagation using Adam optimizer, export two-tower model to use
@app.patch("/run-model")
async def root(userCourseDataObject: UserCourseDataList):
    model = tf.keras.models.load_model(MODEL_FILE_PATH, safe_mode=False)

    stringEmbeddingModel = SentenceTransformer("all-MiniLM-L6-v2")
    transformedLiveDatapoints = []
    courseIdsList = []
    for datapoint in userCourseDataObject.userCourseDataList:
        datapointAsDict = datapoint.dict()
        courseIdsList.append(datapointAsDict["courseId"])
        transformedLiveDatapoints.append(convertDatapointToTensors(datapointAsDict, stringEmbeddingModel))

    batchedLiveDatapoints = {}
    for key in transformedLiveDatapoints[0].keys():
        batchedLiveDatapoints[key] = tf.stack([datapoint[key] for datapoint in transformedLiveDatapoints])

    predictedRecommendationScores = model.predict(batchedLiveDatapoints)
    predictedRecommendationScores = [float(score[0]) for score in predictedRecommendationScores]

    return { "twoTowerRecommendedCourses": topRecommendedCourses(userCourseDataObject.userCourseDataList[0].dict()["userId"], predictedRecommendationScores, courseIdsList) }
