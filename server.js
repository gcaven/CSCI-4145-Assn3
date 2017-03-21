var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
var cloudinary = require('cloudinary');
var bunyan = require('bunyan');
var MongoClient = require('mongodb').MongoClient
var path = require('path');
const uuidV4 = require('uuid/v4');

var app = express();
var upload = multer({ dest: 'uploads/' });
var log = bunyan.createLogger({
    name: 'ass3',
    streams: [
    {
        level: 'debug',
        stream: process.stdout
    },
    {
        level: 'info',
        path: 'log.log'
    }
    ],
  }
);
var cloud_name = 'dhdze0irb';
cloudinary.config({
  cloud_name: cloud_name,
  api_key: '482385852363446',
  api_secret: 'EJq_0z3xMsJ-fXTRd7Rk1voF3X8'
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

var collection;
var dburl = 'mongodb://localhost:27017/ass3';
MongoClient.connect(dburl, function(err, db) {
  if (!err) {
    console.log("Connected successfully to database");
    collection = db.collection('students');
  } else {
    process.exit(1);
  }
});

function logInfo(method, request) {
  log.info({'accessed': method, 'params': request.body, 'user-agent': request.headers['user-agent']});
}

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Listening on port %s", port);
});

app.get("/list", function(request, response) {
  logInfo('/list', request);
  collection.find({}).toArray(function(err, results) {
    if (!err) {
      return response.send(results);
    } else {
      return response.sendStatus(500);
    }
  });
});

app.post("/get_image_url", function(request, response) {
  logInfo('/get_image_url', request);
  if (request.body.studentId.length != 3 || isNaN(request.body.studentId)) {
    return response.sendStatus(400);
  }
  collection.find(
    {'studentId' : request.body.studentId}).toArray(
      function(err, result) {
        if (!err) {
          console.log(result);
          if (result[0] != null && result[0].imgId != null) {
            return response.send({ url: 'https://res.cloudinary.com/' + cloud_name + '/image/upload/' + result[0].imgId });
          } else if (result[0] == null) {
            return response.send({ error: 'student does not exist' });
          } else if (result[0].imgId == null) {
            return response.send({ url: null });
          } else {
            return response.sendStatus(400);
          }
        } else {
          return response.sendStatus(500);
        }
      }
    );
});

app.post("/insert_student", function(request, response) {
  logInfo('/insert_student', request);
  if (request.body.studentId.length != 3 || isNaN(request.body.studentId)) {
    return response.sendStatus(400);
  }
  collection.find({'studentId' : request.body.studentId}).toArray(function(err, result) {
    if (result.length == 0) {
      collection.insertOne({
        'studentId' : request.body.studentId,
        'name' : request.body.name,
        'imgId' : null,
      },
      function(err, result) {
        if (!err) {
          return response.send(result);
        } else {
          return response.sendStatus(500);
        }
      });
    } else {
      return response.sendStatus(400);
    }
  });
});

app.post("/upload_student_image", upload.single('file0'), function(request, response) {
  logInfo('/upload_student_image', request);
  cloudinary.uploader.upload(
    request.file.path,
    function(result) {
      collection.updateOne(
        { 'studentId' : request.body.studentId},
        { $set: { 'imgId' : result.public_id }},
        function(err, result) {
          if (!err) {
            return response.send(result);
          } else {
            return response.sendStatus(500);
          }
        }
      );
    },
    { 'public_id': uuidV4() }
  );
});

app.post("/upload_student_image_url", function (request, response) {
  logInfo('/upload_student_image_url', request);
  cloudinary.uploader.upload(
    request.body.url,
    function(result) {
      collection.updateOne(
        { 'studentId' : request.body.studentId},
        { $set: { 'imgId' : result.public_id }},
        function(err, result) {
          if (!err) {
            return response.send(result);
          } else {
            return response.sendStatus(500);
          }
        }
      );
    },
    { 'public_id': uuidV4() }
  );
});

app.post("/delete_student", function(request, response) {
  logInfo('/delete_student', request);
  collection.deleteOne({ 'studentId' : request.body.studentId },
  function(err, result) {
    if (!err && result.result.n != 0) {
      return response.send(result);
    } else {
      return response.sendStatus(500);
    }
  });
});
