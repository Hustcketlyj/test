/* require modules */
var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var http = require('http');

/* define app to use express */
var app = express();
app.use(bodyParser.urlencoded({extended: true,limit: '50mb',parameterLimit:1000000}));

app.use(session({
	secret: 'csci2720',
	// cookie: { maxAge: 1000*60*60 } // expire in 1 hour
}));
app.use(express.static('content'));

/* connect to mongodb */
var mongodb = "mongodb://ME:1@localhost/csci2720";
mongoose.set('useCreateIndex', true);
mongoose.connect(mongodb, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('Connection is open...');
});

/* define schema */
var Schema = mongoose.Schema;
var UserSchema = Schema({
	username: { type: String, require: true, unique: true },
	pwd: { type: String, require: true },
	favourite: [{ type: String }]
});
/*var StopSchema = Schema({
	stopname: { type: String, require: true, unique: true }, 
	longtitude: { type: Number, require: true },
	latitude: { type: Number, require: true },
	arrival: [{ route: String, time: Date }],
	comment: [{ body: String, username: String, date: Date }]
});*/
 var StopSchema = Schema({ 
    latitude: { type: Number, require:true}, 
    longitude:{type: Number,require:true},
    name: { type: String, require: true, unique: true }, 
    arrival:[{ route: String, stopId:String }] ,
    comment: [{ body: String, username: String, date: Date }]
});
var RouteSchema = Schema({ // this schema can be omitted
	route: { type: String, require: true, unique: true },
	orig: String,
	dest: String
});

/* define model */
User = mongoose.model('User', UserSchema);
Stop= mongoose.model('Stop', StopSchema);
Route = mongoose.model('Route', RouteSchema); // can be ommited

/****** receive http request ******/
/* set header */
app.all('/', (req, res,next) => {
	/* set response header */
	res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, POST");
    res.setHeader("Access-Control-Allow-Headers", "*");
	res.setHeader('Content-Type', 'application/json');
	next();
});
app.use(express.static(__dirname+'/build'));
app.get('/stopmark',function(req,res){
    Stop.find({},
        'latitude longitude name arrival comment',function(err,stop){
            res.send(stop);
        })
});


app.post('/data',function(req,res){
var databody=req.body.alldata;
//console.log(databody[224][eta]+'*****'+databody[227][stopId]);
//console.log(data);
var dataset=[{name:'example',lat:1,long:2,arrival:[{route:0,stopId:'010101'}]}];
var flag=0;
for(var i=0,len=databody.length;i<len;i++){
    flag=0;
    //console.log('******'+databody[i].stopId);
    //console.log("no."+i+' name: '+databody[i].name);
    for(var j=0;j<dataset.length;j++){
       if(databody[i].name.localeCompare(dataset[j].name)===0){
            //console.log("old");
            flag=1;
            dataset[j].arrival.push({route:databody[i].route,stopId:databody[i].stopId});
            //console.log('****'+dataset);
        }
    }
    //console.log('flag is '+flag);
    if(flag===0){
        dataset.push({name:databody[i].name, lat:databody[i].lat, long:databody[i].long, arrival:[{route:databody[i].route,stopId:databody[i].stopId}]});
    }   
}
/*for(var j=0;j<dataset.length;j++){
    console.log(dataset.length);
}
*/
for(let index in dataset){
    if(index!==0)
    {
        var conditions={name:dataset[index].name};
        Stop.findOne(conditions,function(err,stop){
            if(err)
            returhandleError(err);
            if(stop!=null){
                stop.arrival=dataset[index].arrival;
                stop.save();
                console.log("updated");
            }
            else if(stop===null){
                console.log("new one");
                var stop=new Stop({
                  latitude:dataset[index].lat, 
                  longitude:dataset[index].long,
                  name:dataset[index].name, 
                  arrival:dataset[index].arrival,
                  comment:[]
    });
    stop.save(function(err){
    if(err)return err;
    console.log("saved");
    });
            }
        })
        
    }
    
}
});
/*get data from database*/
app.get('/getdata',(req,res)=>{
	
	Stop.find(function(err,result){
		if (err) return err;
		
		res.send(result);
		})
	
	
	
	})
	/* get one's favourite list */
app.get('/favourite', (req, res) => {
	if(req.session.username != undefined) {
		User.findOne({ username: req.session.username }, (err, result) => {
			if(err)
				return console.log(err);
			res.send(result.favourite);
		});
	} else {
		res.send({ 'login': 0 });
	}
});
//get stop
app.get('/stop/:stopname', (req, res) => {
	if(req.session.username != undefined) {
		Stop.findOne({ name: req.params.stopname}, (err, result) => {
			if(err)
				return console.log(err);
			
				res.send(result);
			
		})
	} else {
		res.send({ 'login': 0 });
	}
});

app.get('/*',(req,res)=>{
	
	res.sendFile(__dirname+"/src/index.html");
	
	})
/* sign up */
app.post('/signup', (req, res) => {
	var username = req.body.username;
	var pwd = req.body.pwd;
	User.findOne({ username: username }, (err, result) => {
		if(err)
			return console.log(err);
		if(result)
			res.send({"signup": 0});
		else {
			User.create({ username: username, pwd: pwd}, (err, result) => {
				if(err)
					return console.log(err);
				else
					res.send({"signup": 1});
			});
		}
	});
});
/* log in */
app.post('/login', (req, res) => {
	var username = req.body.username;
	var pwd = req.body.pwd;
	User.findOne({ username: username, pwd: pwd }, (err, result) => {
		if(err)
			return console.log(err);
		if(result) {
			req.session.username = username;
			res.send({"login": 1});
		}
		else 
			res.send({"login": 0});
	});
});
/* log out */
app.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.send({"logout": 1});
	});
});
/* change password */
app.put('/changePwd', (req, res) => {
	if(req.session.username != undefined) {
		var pwd = req.body.pwd;
		var conditions = { username: req.session.username };
		var update = { $set: { pwd: req.body.pwd }};
		User.updateOne(conditions, update, (err, result) => {
			if(err)
				return console.log(err);
			res.send({ 'pwdChanged': 1});
		})
	} else {
		res.send({ 'login': 0 });
	}
})


/* add a favourite stop */
app.put('/favourite/:stopname', (req, res) => {
	if(req.session.username != undefined) {
		var conditions = { username: req.session.username };
		var update = { $addToSet: { favourite: req.params.stopname }};
		User.update(conditions, update, (err, result) => {
			if(err)
				return console.log(err);
			res.send({ 'stopAdded': 1});
		});
	} else {
		res.send({ 'login': 0 });
	}
});

/* remove a stopname from one's favourite list*/
app.delete('/favourite/:stopname', (req, res) => {

	if(req.session.username != undefined) {
		var conditions = { username: req.session.username };
		var update = { $pull: { favourite: req.params.stopname }};
		User.update(conditions, update, (err, result) => {
			if(err)
				return console.log(err);
			if(result.nModified != 0)
				res.send({ 'stopRemoved': 1 });
			else 
				res.send({ 'inFavourite': 0});
		});
	} else {
		res.send({ 'login': 0 });
	}
});
//add comment
app.post('/stop/:stopname', (req, res) => {
	if(req.session.username != undefined) {
		var conditions = {name: req.params.stopname};
		var update = {$addToSet: { comment: req.body }};
		Stop.update(conditions,update, (err, result) => {
			if(err)
				return console.log(err);
			res.send({'addcomment':1});
		});
	} else {
		res.send({ 'login': 0 });
	}
	
});

/**** below are all for admin ****/
/* admin log in */
app.post('/adminLogIn', (req, res) => {
	req.session.admin = true;
	res.send({ 'login': 1});
});

/* admin log out */
/* same as user */

/* admin delete a user */
app.delete('/user/:username', (req, res) => {
	if(req.session.admin != undefined) {
		User.remove({ username: req.params.username}, (err, result) => {
			if(err)
				return console.log(err);
			if(result.deletedCount == 0)
				res.send({ 'deleted': 0 });
			else
				res.send({ 'deleted': 1 });
		})
	} else {
		res.send({ 'authority': 0 });
	}
});

/* admin delete a bus stop */
app.delete('/stop/:stopname', (req, res) => {
	if(req.session.admin != undefined) {
		User.remove({ stopname: req.params.stopname}, (err, result) => {
			if(err)
				return console.log(err);
			if(result.deletedCount == 0)
				res.send({ 'deleted': 0 });
			else
				res.send({ 'deleted': 1 });
		})
	} else {
		res.send({ 'authority': 0 });
	}
});

/* admin get all bus stop */
app.get('/stop', (req, res) => {
	if(req.session.admin != undefined || req.session.username != undefined) {
		Stop.find({}, (err, result) => {
			if(err)
				return console.log(err);
			res.send(result);
		});
	} else {
		res.send({ 'login': 0 });
	}
	
});

/* for test only */
app.post('/stop', (req, res) => {
	StopModel.create({stopname: "test", longtitude: 50, latitude: 30, 
		arrival: [{route: "route1", time: "2020-01-01"}, {route: "route2", time: "2020-01-01"}],
		comment: [{body: "hahaha", username: "user1"}, {body: "ssss", username: "user2"}]   }, (err, result) => {
		if(err)
			return console.log(err);
		res.send({"created": 1});
	});
});

/* flush stop data */
/* flush stop data */
app.post('/flush/stop', (req, res) => {
	if(req.session.admin) {
		StopModel.find({}, (err, result) => {
			if(err) return console.log(err);
			for(var newStop of req.body.stops) {
				var exist = false;
				for(var oldStop of result) {
					if(newStop.stopid == oldStop.stopid) {
						exist = true;
						break;
					}
				}
				if(exist) {
					StopModel.updateOne({stopid: newStop.stopid}, {$set: {stopname: newStop.stopname, longtitude: newStop.longtitude, latitude: newStop.latitude, otherAttr: []}}, (err, result1) => {
						if(err) console.log(err);
					});
				} else {
					StopModel.create({stopid: newStop.stopid, stopname: newStop.stopname, longtitude: newStop.longtitude, latitude: newStop.latitude, arrival: [], comment: [], otherAttr: []}, (err, result2) => {
						if(err) console.log(err);
					});
				}
			}
			for(var attr of req.body.otherAttr) {
				StopModel.updateOne({stopid: attr.stopid}, {$addToSet: {otherAttr: {route: attr.route, seq: attr.seq}}}, (err, result) => {
					if(err) console.log(err);
				})
			}

			res.send({ 'flush': true });
		})
	} else {
		res.send({ 'admin': false });
	}
})

/* flush arrival time */
app.post('/flush/arrival', (req, res) => {
	if(req.session.admin) {
		ArrivalModel.create(req.body.arrival, (err, arrivals) => {
			for(var i in arrivals) {
				StopModel.updateOne({stopid: arrivals[i].stopid}, {$addToSet: {arrival: arrivals[i]._id}}, (err, result) => {
					if(err)
						return console.log(err);
				})
			}
			res.send({ 'flush': true });
		});
	} else {
		res.send({ 'admin': false });
	}
})

/* get all users */
app.get('/user', (req, res) => {
	if(req.session.admin) {
		UserModel.find({}, ['username', 'comment', 'favourite'], (err, result) => {
			res.send(result);
		})
	} else {
		res.send({'admin': false});
	}
})

app.listen(3000);




