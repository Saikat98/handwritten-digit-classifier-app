# importing libraries & user-defined-functions
import os
import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify
import warnings
warnings.filterwarnings("ignore")

app=Flask(__name__)

# loading model
# model_path = "C:/Users/saikat/Desktop/DrawingApp/App/model/digit_classifier_v3.pkl"
model_path = os.path.join(app.root_path, 'model', 'digit_classifier_SVM_v4.pkl')
model = joblib.load(model_path)


@app.route('/')
@app.route('/clear')
def home():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    # getting the data from AJAX
    data = request.get_json()
    pixel_data = data['pixel_data']

    # data preprocessing
    X_test = pd.DataFrame(list(pixel_data)).T
    X_test = X_test.replace(255,1) # scaling
    
    # predict using loaded model
    # prediction_class = model.predict(X_test).tolist()[0]
    prediction_prob = model.predict_proba(X_test).tolist()[0]
    prediction_class = prediction_prob.index(max(prediction_prob)) # getting class from max probabilty

    return jsonify(
        {
            'pixel_data': list(pixel_data),
            'prediction_prob': prediction_prob,
            'prediction_class':prediction_class
        }
    )

if __name__=="__main__":
    app.run(debug=True)