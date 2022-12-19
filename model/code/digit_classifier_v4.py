import os
import numpy as np
import pandas as pd
from PIL import Image
# from sklearn.preprocessing import StandardScaler
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn import metrics
import joblib
from tqdm import tqdm
import warnings
warnings.filterwarnings("ignore")

folder_path = "C:/Users/saikat/Desktop/DrawingApp/App/model"

# # Data source:  https://www.kaggle.com/datasets/oddrationale/mnist-in-csv?select=mnist_train.csv
# train_data = pd.read_csv(folder_path+"/train/mnist_train.csv")
# test_data = pd.read_csv(folder_path+"/test/mnist_test.csv")

# # changing column names in the dataset
# pixels = 28*28
# train_data.columns = ["label"] + list(np.arange(0,pixels))
# test_data.columns = ["label"] + list(np.arange(0,pixels))

# trial
# pixel_data = [
#     [0,0,0,0,0,0],
#     [0,255,0,0,255,0],
#     [0,0,0,0,0,0],
#     [0,255,0,0,255,0],
#     [0,0,255,255,0,0],
#     [0,0,0,0,0,0]
# ]

# printing image as 28x28 pixel grid
# image_path = "C:/Users/saikat/Desktop/DrawingApp/App/model/train/2/img_22.jpg"
def pixel_to_grid(image_path):
    img = Image.open(image_path)
    img = img.convert("1") # convert it to 1 bit b/w
    pixels = list(img.getdata())
    for i in range(28):
        for j in range(28):
            print(f"{pixels[i*28+j]:3d}", end=' ')
        print()

def pixel_to_image(pixel_data):
    # flatten the data
    pixel_data = np.array(pixel_data)
    if pixel_data.shape[1]>1:
        flatten_pixel_data = np.reshape(pixel_data,-1)
    # create image from pixel data
    img = Image.new(mode="1", size=(28,28))
    img.putdata(pixel_data)
    # img.show()
    return img

# helper functions
def image_to_pixel(image_path):
    img = Image.open(image_path)
    img = img.convert("1") # convert it to 1 bit b/w
    # read the pixel data
    pixels = img.load()
    width, height = img.size
    flatten_pixel_data = []
    for y in range(height):
        for x in range(width):
            cpixel = pixels[x, y]
            flatten_pixel_data.append(cpixel)
    # convert pixel data to matrix
    pixel_data = np.reshape(flatten_pixel_data,(width,height))
    return flatten_pixel_data, pixel_data

def create_data(folder_path,img_width,img_height,type:str):
    pixels = img_width*img_height
    data = pd.DataFrame(
        columns=["label"] + list(np.arange(0,pixels))
    )
    for label in tqdm([0,1,2,3,4,5,6,7,8,9]): # change here
        image_path = folder_path + f"/{type}/" + str(label)
        try:
            for image in os.listdir(image_path):
                px = image_to_pixel(image_path+"/"+image)[0]
                lbl = int(image_path[-1])
                temp = pd.DataFrame(px).T
                temp["label"] = lbl
                data = pd.concat(
                    [data,temp],
                    ignore_index=True
                )
        except:
            print("Error: Check path")
    data = data.apply(pd.to_numeric)
    # data.to_excel(folder_path+"/data.xlsx")
    return data

# preparing data
img_height = 28
img_width = 28
train_data = create_data(folder_path=folder_path,img_height=img_height,img_width=img_width,type="train")
# train_data.to_csv(folder_path+"/train/train_data.csv",index=False)
X_train = train_data.iloc[:,1:]
y_train = train_data.iloc[:,0]

# scaling the data
X_train = X_train.replace(255,1)

# fitting a model
# model = KNeighborsClassifier(n_neighbors=4)
model = SVC(kernel='linear', probability=True, random_state=42)
result = model.fit(X_train,y_train)
y_train_pred = result.predict(X_train)
print("Train Accuracy: {:.2%}".format(metrics.accuracy_score(y_train, y_train_pred)))

# saving the model as pickle file
joblib.dump(result, folder_path+'/digit_classifier_SVM_v4.pkl')

# test prediction
result = joblib.load(folder_path+'/digit_classifier_SVM_v4.pkl')
test_data = create_data(folder_path=folder_path,img_height=img_height,img_width=img_width,type="test")
X_test = test_data.iloc[:,1:]
y_test = test_data.iloc[:,0]
X_test = X_test.replace(255,1)
y_test_pred = result.predict(X_test)
print("Test Accuracy: {:.2%}".format(metrics.accuracy_score(y_test, y_test_pred)))