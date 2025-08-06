import tensorflow as tf
import os
from constants import PADDING_VALUE, MAX_SKILLS_INTERESTS_LENGTH, MAX_MINORS_CERTIFICATES_LENGTH, TFRECORD_FILE_PATH, MAX_DESIRED_DESIGNATION_LENGTH, MAX_ECE_AREAS_LENGTH, STRING_EMBEDDING_DIMENSION, ID_EMBEDDING_SIZE, BINARY_INPUT_EMBEDDING_SIZE, BINARY_EMBEDDING_SIZE, ECE_AREAS_EMBEDDING_SIZE, DESIRED_DESIGNATION_EMBEDDING_SIZE, NUMBER_OF_EPOCHS, TFRECORD_BUFFER_SIZE, BATCH_SIZE, SHUFFLE_SAMPLES_SIZE, DATASET_SIZE, FIRST_DENSE_LAYER, SECOND_DENSE_LAYER, MODEL_FILE_PATH

def convertSampleToTensors(sample):
    features = {
        "userSkillsInterestsIds": tf.io.FixedLenFeature([MAX_SKILLS_INTERESTS_LENGTH], tf.int64),
        "userSkillsInterestsSkillOrInterest": tf.io.FixedLenFeature([MAX_SKILLS_INTERESTS_LENGTH], tf.int64),
        "userSkillsInterestsIsSpecific": tf.io.FixedLenFeature([MAX_SKILLS_INTERESTS_LENGTH], tf.int64),
        "userEceAreas": tf.io.FixedLenFeature([MAX_ECE_AREAS_LENGTH], tf.float32),
        "userDesiredDesignation": tf.io.FixedLenFeature([MAX_DESIRED_DESIGNATION_LENGTH], tf.float32),
        "userMinorsCertificatesIds": tf.io.FixedLenFeature([MAX_MINORS_CERTIFICATES_LENGTH], tf.int64),
        "userMinorsCertificatesMinorOrCertificate": tf.io.FixedLenFeature([MAX_MINORS_CERTIFICATES_LENGTH], tf.int64),
        "userLearningGoals": tf.io.VarLenFeature(tf.float32),
        "userLearningGoalsCount": tf.io.FixedLenFeature([], tf.int64),

        "courseSkillsInterestsIds": tf.io.FixedLenFeature([MAX_SKILLS_INTERESTS_LENGTH], tf.int64),
        "courseSkillsInterestsSkillOrInterest": tf.io.FixedLenFeature([MAX_SKILLS_INTERESTS_LENGTH], tf.int64),
        "courseSkillsInterestsIsSpecific": tf.io.FixedLenFeature([MAX_SKILLS_INTERESTS_LENGTH], tf.int64),
        "courseMinorsCertificatesIds": tf.io.FixedLenFeature([MAX_MINORS_CERTIFICATES_LENGTH], tf.int64),
        "courseMinorsCertificatesMinorOrCertificate": tf.io.FixedLenFeature([MAX_MINORS_CERTIFICATES_LENGTH], tf.int64),
        "courseTitle": tf.io.FixedLenFeature([STRING_EMBEDDING_DIMENSION], tf.float32),
        "courseDescription": tf.io.FixedLenFeature([STRING_EMBEDDING_DIMENSION], tf.float32),
        "courseEceAreas": tf.io.FixedLenFeature([MAX_ECE_AREAS_LENGTH], tf.float32),

        "label": tf.io.FixedLenFeature([], tf.int64),
        "weight": tf.io.FixedLenFeature([], tf.float32),
    }

    featuresInTensorForm = tf.io.parse_single_example(sample, features)

    denseFlatLearningGoalsTensor = tf.sparse.to_dense(featuresInTensorForm["userLearningGoals"])
    userLearningGoalsCount = featuresInTensorForm["userLearningGoalsCount"]
    reshapedLearningGoalsTensor = tf.reshape(denseFlatLearningGoalsTensor, tf.stack([userLearningGoalsCount, STRING_EMBEDDING_DIMENSION]))

    userFeatures = {
        "userSkillsInterestsIds": featuresInTensorForm["userSkillsInterestsIds"],
        "userSkillsInterestsSkillOrInterest": featuresInTensorForm["userSkillsInterestsSkillOrInterest"],
        "userSkillsInterestsIsSpecific": featuresInTensorForm["userSkillsInterestsIsSpecific"],
        "userEceAreas": featuresInTensorForm["userEceAreas"],
        "userDesiredDesignation": featuresInTensorForm["userDesiredDesignation"],
        "userMinorsCertificatesIds": featuresInTensorForm["userMinorsCertificatesIds"],
        "userMinorsCertificatesMinorOrCertificate": featuresInTensorForm["userMinorsCertificatesMinorOrCertificate"],
        "userLearningGoals": reshapedLearningGoalsTensor,
    }

    courseFeatures = {
        "courseSkillsInterestsIds": featuresInTensorForm["courseSkillsInterestsIds"],
        "courseSkillsInterestsSkillOrInterest": featuresInTensorForm["courseSkillsInterestsSkillOrInterest"],
        "courseSkillsInterestsIsSpecific": featuresInTensorForm["courseSkillsInterestsIsSpecific"],
        "courseMinorsCertificatesIds": featuresInTensorForm["courseMinorsCertificatesIds"],
        "courseMinorsCertificatesMinorOrCertificate": featuresInTensorForm["courseMinorsCertificatesMinorOrCertificate"],
        "courseTitle": featuresInTensorForm["courseTitle"],
        "courseDescription": featuresInTensorForm["courseDescription"],
        "courseEceAreas": featuresInTensorForm["courseEceAreas"],
    }

    label = featuresInTensorForm["label"]
    weight = featuresInTensorForm["weight"]

    return {**userFeatures, **courseFeatures}, label, weight

def createUserTower():
    userInputBatch = {
        "userSkillsInterestsIds": tf.keras.Input(shape=(MAX_SKILLS_INTERESTS_LENGTH,), name="userSkillsInterestsIds", dtype=tf.int64),
        "userSkillsInterestsSkillOrInterest": tf.keras.Input(shape=(MAX_SKILLS_INTERESTS_LENGTH,), name="userSkillsInterestsSkillOrInterest", dtype=tf.int64),
        "userSkillsInterestsIsSpecific": tf.keras.Input(shape=(MAX_SKILLS_INTERESTS_LENGTH,), name="userSkillsInterestsIsSpecific", dtype=tf.int64),
        "userEceAreas": tf.keras.Input(shape=(MAX_ECE_AREAS_LENGTH,), name="userEceAreas", dtype=tf.float32),
        "userDesiredDesignation": tf.keras.Input(shape=(MAX_DESIRED_DESIGNATION_LENGTH,), name="userDesiredDesignation", dtype=tf.float32),
        "userMinorsCertificatesIds": tf.keras.Input(shape=(MAX_MINORS_CERTIFICATES_LENGTH,), name="userMinorsCertificatesIds", dtype=tf.int64),
        "userMinorsCertificatesMinorOrCertificate": tf.keras.Input(shape=(MAX_MINORS_CERTIFICATES_LENGTH,), name="userMinorsCertificatesMinorOrCertificate", dtype=tf.int64),
        "userLearningGoals": tf.keras.Input(shape=(None, STRING_EMBEDDING_DIMENSION), name="userLearningGoals", dtype=tf.float32),
    }

    skillsInterestsIdsEmbedLayer = tf.keras.layers.Embedding(input_dim=MAX_SKILLS_INTERESTS_LENGTH + 1, output_dim=ID_EMBEDDING_SIZE, mask_zero=True)
    skillsInterestsSkillOrInterestEmbedLayer = tf.keras.layers.Embedding(input_dim=BINARY_INPUT_EMBEDDING_SIZE, output_dim=BINARY_EMBEDDING_SIZE, mask_zero=True)
    skillsInterestsIsSpecificEmbedLayer = tf.keras.layers.Embedding(input_dim=BINARY_INPUT_EMBEDDING_SIZE, output_dim=BINARY_EMBEDDING_SIZE, mask_zero=True)
    eceAreasDenseLayer = tf.keras.layers.Dense(ECE_AREAS_EMBEDDING_SIZE, activation="relu")
    desiredDesignationDenseLayer = tf.keras.layers.Dense(DESIRED_DESIGNATION_EMBEDDING_SIZE, activation="relu")
    minorsCertificatesIdsEmbedLayer = tf.keras.layers.Embedding(input_dim=MAX_MINORS_CERTIFICATES_LENGTH + 1, output_dim=ID_EMBEDDING_SIZE, mask_zero=True)
    minorsCertificatesMinorOrCertificateEmbedLayer = tf.keras.layers.Embedding(input_dim=BINARY_INPUT_EMBEDDING_SIZE, output_dim=BINARY_EMBEDDING_SIZE, mask_zero=True)

    embeddedUserFeatures = [
        tf.keras.layers.GlobalAveragePooling1D()(skillsInterestsIdsEmbedLayer(userInputBatch["userSkillsInterestsIds"])),
        tf.keras.layers.GlobalAveragePooling1D()(skillsInterestsSkillOrInterestEmbedLayer(userInputBatch["userSkillsInterestsSkillOrInterest"])),
        tf.keras.layers.GlobalAveragePooling1D()(skillsInterestsIsSpecificEmbedLayer(userInputBatch["userSkillsInterestsIsSpecific"])),
        eceAreasDenseLayer(userInputBatch["userEceAreas"]),
        desiredDesignationDenseLayer(userInputBatch["userDesiredDesignation"]),
        tf.keras.layers.GlobalAveragePooling1D()(minorsCertificatesIdsEmbedLayer(userInputBatch["userMinorsCertificatesIds"])),
        tf.keras.layers.GlobalAveragePooling1D()(minorsCertificatesMinorOrCertificateEmbedLayer(userInputBatch["userMinorsCertificatesMinorOrCertificate"])),
        tf.keras.layers.GlobalAveragePooling1D()(userInputBatch["userLearningGoals"])
    ]

    outputVector = tf.keras.layers.Concatenate()(embeddedUserFeatures)
    outputVector = tf.keras.layers.Dense(FIRST_DENSE_LAYER, activation="relu")(outputVector)
    outputVector = tf.keras.layers.Dense(SECOND_DENSE_LAYER, activation="relu")(outputVector)
    return tf.keras.Model(inputs=userInputBatch, outputs=outputVector)


def createCourseTower():
    courseInputBatch = {
        "courseSkillsInterestsIds": tf.keras.Input(shape=(MAX_SKILLS_INTERESTS_LENGTH,), name="courseSkillsInterestsIds", dtype=tf.int64),
        "courseSkillsInterestsSkillOrInterest": tf.keras.Input(shape=(MAX_SKILLS_INTERESTS_LENGTH,), name="courseSkillsInterestsSkillOrInterest", dtype=tf.int64),
        "courseSkillsInterestsIsSpecific": tf.keras.Input(shape=(MAX_SKILLS_INTERESTS_LENGTH,), name="courseSkillsInterestsIsSpecific", dtype=tf.int64),
        "courseMinorsCertificatesIds": tf.keras.Input(shape=(MAX_MINORS_CERTIFICATES_LENGTH,), name="courseMinorsCertificatesIds", dtype=tf.int64),
        "courseMinorsCertificatesMinorOrCertificate": tf.keras.Input(shape=(MAX_MINORS_CERTIFICATES_LENGTH,), name="courseMinorsCertificatesMinorOrCertificate", dtype=tf.int64),
        "courseEceAreas": tf.keras.Input(shape=(MAX_ECE_AREAS_LENGTH,), name="courseEceAreas", dtype=tf.float32),
        "courseTitle": tf.keras.Input(shape=(STRING_EMBEDDING_DIMENSION,), name="courseTitle", dtype=tf.float32),
        "courseDescription": tf.keras.Input(shape=(STRING_EMBEDDING_DIMENSION,), name="courseDescription", dtype=tf.float32),
    }

    skillsInterestsIdsEmbedLayer = tf.keras.layers.Embedding(input_dim=MAX_SKILLS_INTERESTS_LENGTH + 1, output_dim=ID_EMBEDDING_SIZE, mask_zero=True)
    skillsInterestsSkillOrInterestEmbedLayer = tf.keras.layers.Embedding(input_dim=BINARY_INPUT_EMBEDDING_SIZE, output_dim=BINARY_EMBEDDING_SIZE, mask_zero=True)
    skillsInterestsIsSpecificEmbedLayer = tf.keras.layers.Embedding(input_dim=BINARY_INPUT_EMBEDDING_SIZE, output_dim=BINARY_EMBEDDING_SIZE, mask_zero=True)
    minorsCertificatesIdsEmbedLayer = tf.keras.layers.Embedding(input_dim=MAX_MINORS_CERTIFICATES_LENGTH + 1, output_dim=ID_EMBEDDING_SIZE, mask_zero=True)
    minorsCertificatesMinorOrCertificateEmbedLayer = tf.keras.layers.Embedding(input_dim=BINARY_INPUT_EMBEDDING_SIZE, output_dim=BINARY_EMBEDDING_SIZE, mask_zero=True)
    eceAreasDenseLayer = tf.keras.layers.Dense(ECE_AREAS_EMBEDDING_SIZE, activation="relu")

    # Courses can have no minors/certificates, leading to NaN during pooling/averaging, so replace with a zero vector
    courseMinorsCertificatesIds = tf.keras.layers.GlobalAveragePooling1D()(minorsCertificatesIdsEmbedLayer(courseInputBatch["courseMinorsCertificatesIds"]))
    courseMinorsCertificatesIds = tf.keras.layers.Lambda(lambda ids: tf.where(tf.math.is_nan(ids), tf.zeros_like(ids), ids))(courseMinorsCertificatesIds)
    courseMinorsCertificatesMinorOrCertificate = tf.keras.layers.GlobalAveragePooling1D()(minorsCertificatesMinorOrCertificateEmbedLayer(courseInputBatch["courseMinorsCertificatesMinorOrCertificate"]))
    courseMinorsCertificatesMinorOrCertificate = tf.keras.layers.Lambda(lambda minorOrCert: tf.where(tf.math.is_nan(minorOrCert), tf.zeros_like(minorOrCert), minorOrCert))(courseMinorsCertificatesMinorOrCertificate)

    embeddedCourseFeatures = [
        tf.keras.layers.GlobalAveragePooling1D()(skillsInterestsIdsEmbedLayer(courseInputBatch["courseSkillsInterestsIds"])),
        tf.keras.layers.GlobalAveragePooling1D()(skillsInterestsSkillOrInterestEmbedLayer(courseInputBatch["courseSkillsInterestsSkillOrInterest"])),
        tf.keras.layers.GlobalAveragePooling1D()(skillsInterestsIsSpecificEmbedLayer(courseInputBatch["courseSkillsInterestsIsSpecific"])),
        courseMinorsCertificatesIds,
        courseMinorsCertificatesMinorOrCertificate,
        eceAreasDenseLayer(courseInputBatch["courseEceAreas"]),
        courseInputBatch["courseTitle"],
        courseInputBatch["courseDescription"],
    ]

    outputVector = tf.keras.layers.Concatenate()(embeddedCourseFeatures)
    outputVector = tf.keras.layers.Dense(FIRST_DENSE_LAYER, activation="relu")(outputVector)
    outputVector = tf.keras.layers.Dense(SECOND_DENSE_LAYER, activation="relu")(outputVector)
    return tf.keras.Model(inputs=courseInputBatch, outputs=outputVector)

def createTwoTowerModel():
    userTower = createUserTower()
    courseTower = createCourseTower()

    userFeatures = userTower.input
    courseFeatures = courseTower.input

    totalFeaturesInput = {**userFeatures, **courseFeatures}

    userEmbedding = userTower(userFeatures)
    courseEmbedding = courseTower(courseFeatures)

    dotProduct = tf.keras.layers.Dot(axes=1, normalize=True)([userEmbedding, courseEmbedding])
    similarityScore = tf.keras.layers.Dense(1, activation="sigmoid")(dotProduct)

    return tf.keras.Model(inputs=totalFeaturesInput, outputs=similarityScore)

if __name__ == '__main__':
    dataset = tf.data.TFRecordDataset(TFRECORD_FILE_PATH, buffer_size=TFRECORD_BUFFER_SIZE)
    dataset = dataset.map(convertSampleToTensors).shuffle(SHUFFLE_SAMPLES_SIZE).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE).repeat()

    stepsPerEpoch = DATASET_SIZE // BATCH_SIZE
    model = createTwoTowerModel()
    # Performs weighted bce
    model.compile(optimizer="adam", loss=tf.keras.losses.BinaryCrossentropy(), metrics=["accuracy"]) 
    summary = model.fit(dataset, epochs=NUMBER_OF_EPOCHS, steps_per_epoch=stepsPerEpoch)

    model.save(MODEL_FILE_PATH)

    # Display summary of 
    print (f"Summary: \n{summary.history}")
    




