var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

var path = __dirname + '/views/'

var users = ['fsy', 'lzh', 'hy', 'xjw', 'yjb', 'xq', 'zx', 'wjl', 'cxy', 'ljy', 'zzz', 'fz', 'hl', 'ys', 'zxd', 'zk', 'hjc']
var passwords = ['1598', '9982', '5665', '8107', '5754', '2408', '0482', '9808', '3932', '9603', '7971', '2875', '2103', '8086', '7606', '0051', '2213']

function getFormattedDate(){
    var d = new Date();
    d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
    return d;
}

var credentials = {};
var transactions = {};
var transactionsPerUser = {};

for (i = 0; i < users.length; i++) {
	console.log(users[i] + " " + passwords[i]);
	credentials[users[i]] = passwords[i];
}

app.use(express.static("public"));
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use(cookieParser());
app.use(session({secret: "Shhhh"}));

app.get('/', function (req, res) {
	if (req.session.user_name === undefined) {
		console.log("redirecting to signin from /");
		res.redirect('signin');
		return;
	}

	console.log("redirecting from / to /index");
	res.redirect('/index');
});

app.get('/signin', function(req, res) {
	res.sendFile(path + 'signin.html');
});

app.get('/logout', function(req, res) {
	req.session.user_name = undefined;
	console.log("redirecting from /logout to /");
	res.redirect('/');
});

app.get('/index', function (req, res) {
	console.log("user name saved in session : " + req.session.user_name);
	if (req.session.user_name === undefined) {
		console.log("redirecting to signin from /index");
		res.redirect('/signin');
		return;
	}

	res.sendFile(path + 'index.html');
});

app.post('/login', function (req, res) {
	var user_name = req.body.username;
	var password = req.body.password;
	console.log("User : " + user_name + ", password is :" + password);
	if (credentials[user_name] === password) {
		req.session.user_name = user_name;
		res.send('success');
	} else {
		res.send('failed');
	}
	
});

app.post('/bet', function (req, res) {
	if (req.session.user_name === undefined) {
		res.redirect('/signin');
		return;
	}
	var ag = req.body.awaygoal;
	var hg = req.body.homegoal;
	var bet = req.body.nbet;
	var fid = req.body.fid;
	var user = req.session.user_name;
	console.log("betting.... ");
	var dateNow = getFormattedDate();
	console.log(dateNow + ": " + user + " is betting $" + bet + " on " + hg + ":" + ag + " match : " + fid);
	if (transactions[fid] === undefined)
		transactions[fid] = [];
	transactions[fid].push({user : user, bet : bet, hg : hg, ag : ag, fid : fid, date : dateNow});
	
	if (transactionsPerUser[user] === undefined)
		transactionsPerUser[user] = [];
	transactionsPerUser[user].push({user : user, bet : bet, hg : hg, ag : ag, fid : fid, date : dateNow});
	res.send("success");
});

app.get('/transactions', function (req, res) {
	res.json(transactions);
});

app.get('/transactions/my', function (req, res) {
	if (req.session.user_name === undefined) {
		res.redirect('/signin');
		return;
	}

	var user = req.session.user_name;
	res.json(transactionsPerUser[user]);
})

app.get('/transactions/clear', function (req, res) {
	transactions = {};
	transactionsPerUser = {};
	res.send("OK");
});

app.listen(process.env.PORT || 80);