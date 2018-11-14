from keras.models import load_model
from collections import deque
import numpy as np
import cv2
import os, sys
from PIL import Image
import pyrebase

#Configure Firebase
config = {
  "apiKey": "AIzaSyAHex43Nme85Xf2foycuONIU-jlR5yZYww",
  "authDomain": "imageclassify-93207.firebaseapp.com",
  "databaseURL": "https://imageclassify-93207.firebaseio.com/",
  "storageBucket": "imageclassify-93207.appspot.com"
}

firebase = pyrebase.initialize_app(config)
storage = firebase.storage()
db = firebase.database()

# get the images and their names from the database
images = db.child("images")

# keep the key of the image to store classification later
imageKey = ""

# store the images locally for classification
for imageData in images.get().each():
  imageVal = imageData.val()
  if imageVal is not None and "classification" not in imageVal.keys():
    # downloading the image from the firebase storage
    imageName = imageVal["imageName"]
    storage.child(imageName).download("images/" + imageName)
    imageKey = imageData.key()
    break

# Load the models built in the previous steps
cnn_model = load_model('emnist_cnn_model.h5')

# Letters lookup
letters = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 9: 'i', 10: 'j',
11: 'k', 12: 'l', 13: 'm', 14: 'n', 15: 'o', 16: 'p', 17: 'q', 18: 'r', 19: 's', 20: 't',
21: 'u', 22: 'v', 23: 'w', 24: 'x', 25: 'y', 26: 'z', 27: '-'}

# Define a 5x5 kernel for erosion and dilation
kernel = np.ones((5, 5), np.uint8)

# Define prediction variables
prediction1 = 26
prediction2 = 26

all_images = []
for image_path in os.listdir('images/'):
    if "png" in str(image_path):
        image_path = 'images/' + image_path

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        # print(img)
        # im_array = cv2.bitwise_not(img)

        newImage = cv2.resize(img, (28, 28))
        print(newImage)
        newImage = np.array(newImage)
        newImage = newImage.astype('float32')/255

        prediction2 = cnn_model.predict(newImage.reshape(1,28,28,1))[0]
        prediction2 = np.argmax(prediction2)

print("Convolution Neural Network:  " + str(letters[int(prediction2)+1]), (10, 440), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

# adding the classified letter to the database
classification = str(letters[int(prediction2)+1])
db.child("images").child(imageKey).update({"classification" : classification})


