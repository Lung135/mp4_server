// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var Llama = require('./models/llama');
var bodyParser = require('body-parser');
var router = express.Router();

//my schemas
var User = require('./models/user');
var Task = require('./models/task');

//replace this with your Mongolab URL
mongoose.connect('mongodb://lucas:pw1@ds019960.mlab.com:19960/cs498mp4');

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

// app.use(express.methodOverride());

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.json());

// All our routes will start with /api
app.use('/api', router);

//Default route here
var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
  res.json({ message: 'Hello World!' });
});

//Llama route
var llamaRoute = router.route('/llamas');

llamaRoute.get(function(req, res) {
  res.json([{ "name": "alice", "height": 12 }, { "name": "jane", "height": 13 }]);
});

//Add more routes here

//users route
var usersRoute = router.route('/users');

usersRoute.get(function(req, res) {

	var query = User.find();

	var filters = req.query;
	console.log(filters);
	// filters = JSON.stringify(filters);
	// console.log(filters);
	var f;
	if(filters.where) {
		f = filters.where;
		f = JSON.parse(f);
		query = User.find(f);
	}
	if(filters.sort) {
		f = filters.sort;
		f = JSON.parse(f);
		query = query.sort(f);
	}
	if(filters.select) {
		f = filters.select;
		f = JSON.parse(f);
		query = query.select(f);
	}
	if(filters.skip) {
		f = filters.skip;
		f = JSON.parse(f);
		query = query.skip(f);
	}
	if(filters.limit) {
		f = filters.limit;
		f = JSON.parse(f);
		query = query.limit(f);
	}
	if(filters.count) {
		f = filters.count;
		f = JSON.parse(f);
		query = query.count(f);
	}

	query.exec(function(err, users) {
		if(err) {
			res.status(404).send(err)
		}
		else {
			res.status(200).json({message: "OK", data: users});
		}
	});
});

usersRoute.post(function(req, res) {
	var bad = false;
	if(req.body.name == '' || req.body.email == '') {
		res.status(500).json({message: "You must input a name and email!"})
		bad = true;
	}
	User.find(function(err, users) {
		var emails = [];
		for(var i = 0; i < users.length; i++) {
			emails.push(users[i].email);
		}
		if(emails.indexOf(req.body.email) != -1) {
			res.status(500).json({message: "That Email already exists!"});
			bad = true;
		}
		if(!bad) {
			var newUser = new User();
			newUser.name = req.body.name;
			newUser.email = req.body.email;
			newUser.pendingTasks = [];
			newUser.save(function(err) {
				if(err) {
					res.send(err);
				}
				else {
					res.status(201).json({message: "New user created!"});
				}
			});
		}
	});

});

//TODO: OPTIONS

//--------- /users/:id ------------

var usersByIdRoute = router.route('/users/:id');
 
usersByIdRoute.get(function(req, res) {
	User.findById(req.params.id, function(err, user) {
		if(err) {
			res.status(404).send(err);
		}
		else {
			res.status(200).json({message: "OK.", data: user});

		}
	});
});

usersByIdRoute.delete(function(req, res) {
	User.remove({
		_id: req.params.id
	}, function(err, user) {
		if(err) {
			res.send(err);
		}
		else {
			res.status(200).json({message: 'OK. User Deleted.'});
		}
	});
});

usersByIdRoute.put(function(req, res) {

	User.findById(req.params.id, function(err, user) {
		if(err) {
			res.status(404).send(err);
		}
		else {
			user.name = req.body.name;
			user.email = req.body.email;
			user.pendingTasks = req.body.pendingTasks;
			user.save(function(err) {
				if(err)
					res.send(err);
				res.status(200).json({message: "OK. User Updated", data: user});
			});

		}
	});
});

//--------- /tasks ------------
var tasksRoute = router.route('/tasks');

tasksRoute.get(function(req, res) {
	var query = Task.find();

	var filters = req.query;
	console.log(filters);
	// filters = JSON.stringify(filters);
	// console.log(filters);
	var f;
	if(filters.where) {
		f = filters.where;
		f = JSON.parse(f);
		query = Task.find(f);
	}
	if(filters.sort) {
		f = filters.sort;
		f = JSON.parse(f);
		query = query.sort(f);
	}
	if(filters.select) {
		f = filters.select;
		f = JSON.parse(f);
		query = query.select(f);
	}
	if(filters.skip) {
		f = filters.skip;
		f = JSON.parse(f);
		query = query.skip(f);
	}
	if(filters.limit) {
		f = filters.limit;
		f = JSON.parse(f);
		query = query.limit(f);
	}
	if(filters.count) {
		f = filters.count;
		f = JSON.parse(f);
		query = query.count(f);
	}

	query.exec(function(err, tasks) {
		if(err) {
			res.status(404).send(err)
		}
		else {
			res.status(200).json({message: "OK", data: tasks});
		}
	})
});

tasksRoute.post(function(req, res) {
	var newTask = new Task();
	newTask.name = req.body.name;
	newTask.description = req.body.description;
	newTask.deadline = req.body.deadline;
	newTask.completed = false;
	newTask.assignedUser = req.body.assignedUser; //user _id
	newTask.assignedUserName = req.body.assignedUserName;

	// newTask.save().then(function(err) {
	// 	if(err) {
	// 		res.send(err);
	// 	}
	// 	else {
	// 		res.status(201).json({message: "Task Created"});
	// 	}
	// })

	newTask.save(function(err) {
		if(err) {
			res.send(err);
		}
		else {
			res.status(201).json({message: "Task Created", data: newTask});
		}
	});
});

//--------- /tasks/:id ------------
var tasksByIdRoute = router.route('/tasks/:id');

tasksByIdRoute.get(function(req, res) {
	Task.findById(req.params.id, function(err, task) {
		if(err) {
			res.status(404).send(err);
		}
		else {
			res.status(200).json({message: "OK", data: task});
		}
	})
});

tasksByIdRoute.delete(function(req, res) {
	Task.remove({
		_id: req.params.id
	}, function(err, task) {
		if(err) {
			res.send(err);
		}
		else {
			res.status(200).json({message: 'OK. Task Deleted.'});
		}
	});
});

tasksByIdRoute.put(function(req, res) {

	Task.findById(req.params.id, function(err, task) {
		if(err) {
			res.status(404).send(err);
		}
		else {
			task.name = req.body.name;
			task.description = req.body.description;
			task.deadline = req.body.deadline;
			task.assignedUser = req.body.assignedUser;
			task.completed = req.body.completed;
			task.assignedUserName = req.body.assignedUserName;

			task.save(function(err) {
				if(err)
					res.send(err);
				res.status(200).json({message: "OK. Task Updated", data: task});
			});

		}
	});
});

// Start the server
app.listen(port);
console.log('Server running on port ' + port);
