from flask import Flask
from flask import render_template,request,jsonify
from flask_bootstrap import Bootstrap
from pymongo import MongoClient
from bson import json_util
from bson.json_util import dumps
from threading import Thread
from flask import Response
import json
import os
import csv
import os.path
import time

app = Flask(__name__)
Bootstrap(app)


MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'first1'
COLLECTION_NAME = 'projects'
FIELDS = {'date': True,
'state': True,
'city_or_county': True,
'address': True,
'n_killed': True,
'n_injured': True,
'congressional_district': True ,
'latitude': True ,
'longitude': True ,
'n_guns_involved': True ,
'state_house_district': True ,
'state_senate_district': True ,
'zip_code': True ,
'n_child': True ,
'n_teen': True ,
'n_adult': True ,
'n_child_victim': True ,
'n_teen_victim': True ,
'n_adult_victim': True ,
'n_male': True ,
'n_female': True ,
'n_male_victim': True ,
'n_female_victim': True ,
'n_male_victim':True,
'n_female_victim':True,
'state_ab': True,
'_id': False,
'population':True,
'n_killed_normalized_state':True,
'county_population':True,
'zipcode_population':True
}



# # ---------zipcode DB init--------------
#
MONGODB_HOST2 = 'localhost'
DBS_NAME2 = 'second'
MONGODB_PORT2 = 27018
COLLECTION_NAME2 = 'projects2'
FIELDS2 = {
'GEOID':True,
'Average Household Income':True,
'Average Household Income':True,
'Median House Value':True,
'_id':False}
#
#
#
#
#
#
# # ---------------------------------------
static_zip = 90001

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/trends")
def trends():
	print("trends begin")



	return render_template("trends.html")



@app.route("/first1/projects")
def firset_projects():
    connection = MongoClient(MONGODB_HOST,MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS,limit = 240000)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)


    connection.close()


    return json_projects


@app.route("/test2")
def second_projects():
    connection = MongoClient(MONGODB_HOST2,MONGODB_PORT2)
    collection = connection[DBS_NAME2][COLLECTION_NAME2]
    test  =list( collection.find({'GEOID':8817}))
    print('I am HERE!!!!',test[0].get('loc'))
    arr = test[0].get('loc')
    print('hahahahha',arr)
    projects = collection.find({"loc":{"$near":arr,"$maxDistance":0.1}},{"GEOID":1,"_id":0});
    arr2  = []
    for doc in projects:
        print(doc)
        arr2.append(doc.get('GEOID'))
    print(arr2)

    connection2 = MongoClient(MONGODB_HOST,MONGODB_PORT)
    collection2 = connection2[DBS_NAME][COLLECTION_NAME]

    projects = collection2.find({"zip_code":{"$in":arr2}},{"_id":0})


    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects



@app.route("/test")
def test():
    connection = MongoClient(MONGODB_HOST,MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find({'zip_code':10024})
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)


    connection.close()
    return json_projects

# test aggragation
@app.route("/first1/zipfilter",methods = ['POST'])
def zipfilter():
        print('you are in filter!!!!!!')
        result = request.form
        dynamic_zip = result['Area']
        dynamic_zip=int(dynamic_zip)
        print('zipcode is',dynamic_zip)

        connection = MongoClient(MONGODB_HOST2,MONGODB_PORT2)
        collection = connection[DBS_NAME2][COLLECTION_NAME2]
        test = list(collection.find({'GEOID':dynamic_zip}))
        arr = test[0].get('loc')
        print('I am HERE!!!!',test[0].get('loc'))
        projects = collection.find({"loc":{"$near":arr,"$maxDistance":0.08}},{"GEOID":1,"_id":0}).limit(10);
        arr2 = []       #list of nearby zipcode
        for doc in projects:
            arr2.append(doc.get('GEOID'))


        with open('./static/second/onlynearzip.json','w') as fout:
            json.dump(arr2,fout)

        connection2 = MongoClient(MONGODB_HOST,MONGODB_PORT)
        collection2 = connection2[DBS_NAME][COLLECTION_NAME]

        projects3 = collection2.find({"zip_code":{"$in":arr2}},{"_id":0})
        json_projects3 = []
        for project in projects3:
                json_projects3.append(project)
        with open('./static/second/data_new.json','w') as fout:
            json.dump(json_projects3,fout)

        projects2 = collection2.find({"zip_code":{"$in":arr2}},{'latitude':1,'longitude':1,'source_url':1,"_id":0})
        json_projects2 = []
        for project in projects2:
            json_projects2.append(project)

        with open('./static/second/location.json','w') as fout:
            json.dump(json_projects2,fout)


        #utlize mongodb aggregate function to find the toall num of accident per zipcode for  a specific array of zipcode
        projects5 = collection2.aggregate([{"$match":{"zip_code":{"$in":arr2}}},{"$group":{"_id":"$zip_code","count":{"$sum":1}}},{"$sort":{"count":1}}])
        json_projects5 = []
        for project in projects5:
            json_projects5.append(project)

        with open('./static/second/aggregat_ecount_foreach_zipcode.json','w') as fout:
            json.dump(json_projects5,fout)

        #finished aggreage file creation

        project4 = collection.find({"GEOID":{"$in":arr2}},{'Median Age':1,'Average Household Income':1,'Total Population':1,'Total Housing Units':1,'Median Household Income' : 1,'Median House Value':1,'GEOID':1,'latitude':1,'longitude':1,'loc':1,"_id":0})
        json_projects4 = []

        for project in project4:
            json_projects4.append(project)
        print('what is that !!!',json_projects4)
        with open('./static/second/zip_loc.json','w') as fout:
            json.dump(json_projects4,fout)

        connection.close()
        # return json_projects

# test aggragation

@app.route("/about")
def about():
    print("delete begin")
    if os.path.exists("./static/second/data_new.json"):
        os.remove("./static/second/data_new.json")

    if os.path.exists("./static/second/location.json"):
        os.remove("./static/second/location.json")

    if os.path.exists("./static/second/onlynearzip.json"):
        os.remove("./static/second/onlynearzip.json")

    if os.path.exists("./static/second/zip_loc.json"):
        os.remove("./static/second/zip_loc.json")

    if os.path.exists("./static/second/aggregat_ecount_foreach_zipcode.json"):
        os.remove("./static/second/aggregat_ecount_foreach_zipcode.json")


    print("delete stop")
    return render_template("about.html")


@app.route("/result",methods = ['POST','GET'])
def result():
    while not os.path.exists("./static/second/data_new.json") or not os.path.exists("./static/second/aggregat_ecount_foreach_zipcode.json") or not os.path.exists("./static/second/zip_loc.json"):
        time.sleep(0.001)
    # while not os.path.exists("./static/second/data_new.json"):
    #     time.sleep(0.1)
    # while not os.path.exists("./static/second/data_new.json"):
    #     time.sleep(0.1)
    if os.path.isfile("./static/second/data_new.json"):
        if request.method == 'POST':
            result = request.form
            print('test')

        print('test')
        return render_template("result.html",result = result)


if __name__ == "__main__":
    app.run(debug=True)
