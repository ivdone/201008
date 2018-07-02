var express = require('express');
var request = require('request');
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
	var ag = parseInt(req.body.awaygoal);
	var hg = parseInt(req.body.homegoal);
	var bet = parseInt(req.body.nbet);
	var fid = req.body.fid;
	var bettime = req.body.bet_time;
	var user = req.session.user_name;
	console.log("betting.... ");
	var dateNow = getFormattedDate();
	console.log(dateNow + ": " + user + " is betting $" + bet + " on " + hg + ":" + ag + " match : " + fid);
	if (transactions[fid] === undefined)
		transactions[fid] = [];
	transactions[fid].push({user : user, bet : bet, hg : hg, ag : ag, fid : fid, bettime : bettime || "赛前"});

	if (transactionsPerUser[user] === undefined)
		transactionsPerUser[user] = [];
	transactionsPerUser[user].push({user : user, bet : bet, hg : hg, ag : ag, fid : fid, bettime : bettime || "赛前"});
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
	if (req.session.user_name !== "zzz") {
		res.send("Forbbiden");
		return;
	}
	transactions = {};
	transactionsPerUser = {};
	res.send("OK");
});

app.get('/transactions/clear/:match', function (req, res) {
	if (req.session.user_name !== "zzz") {
		res.send("Forbbiden");
		return;
	}
	
	var match = req.params.match;
	delete transactions[match];

	for (var user in transactionsPerUser) {
		for (var tran = transactionsPerUser[user].length - 1; tran >= 0; tran--) {
			if (transactionsPerUser[user][tran].fid === match) {
				transactionsPerUser[user].splice(tran, 1);
			}
		}
	}

	res.send("OK");
});

function calculateResult(fid, score) {
	console.log("calculating " + fid + " " + score);
	var transaction = transactions[fid];
	var total = 0;
	var totalWinnerBet = 0;
	var totalWinner = {};
	var result = {};
	if (transaction === undefined)
		return {match : fid, result : {}};
	for (var t of transaction) {
		if (result[t.user] === undefined)
			result[t.user] = 0;

		if (t.hg === score[0] && t.ag === score[1]) {
			if (totalWinner[t.user] === undefined)
				totalWinner[t.user] = 0;

			totalWinner[t.user] += t.bet;
			totalWinnerBet += t.bet;

			single = total / totalWinnerBet;

			for (var u in totalWinner) {
				result[u] += totalWinner[u] * single;
			}

			total = 0;
		} else {
			total += t.bet;
			result[t.user] -= t.bet;
		}
	}

	if (totalWinnerBet === 0)
		return {match : fid, result : {}};

	single = total / totalWinnerBet;
	for (var u in totalWinner) {
		result[u] += totalWinner[u] * single;
	}

	return {match: fid, result : result};
}

function calculatePricePool(fid) {
	var transaction = transactions[fid];
	var total = 0;
	if (transaction === undefined)
		return {match : fid, result : 0};
	for (var t of transaction) {
		total += t.bet;
	}

	return {match: fid, result : total};
}

app.get('/transactions/result/:match', function (req, res) {	
	var match = req.params.match;
	request('https://worldcup.sfg.io/matches/' + match, { json: true }, (err, response, body) => {
	  var r = [];	   	
	  for (var m in body) {	 
	  	r.push(calculateResult(body[m].fifa_id, [body[m].home_team.goals, body[m].away_team.goals]));	    
	  }
	  res.json(r);
	});	
});

app.get('/transactions/result/', function (req, res) {	
	request('https://worldcup.sfg.io/matches/today', { json: true }, (err, response, body) => {
	  if (err) { res.send("error"); return; }
	  var r = [];
	  for (var m in body) {
	  	r.push(calculateResult(body[m].fifa_id, [body[m].home_team.goals, body[m].away_team.goals]));	    
	  }
	  res.json(r);
	});	
});

app.get('/transactions/pricepool/:match', function (req, res) {		
	res.json([calculatePricePool(req.params.match)]);
});

app.get('/transactions/pricepool', function (req, res) {	
	var r = [];
	for (var t in transactions) {
		r.push(calculatePricePool(t));
	}

	res.json(r);
});

app.listen(process.env.PORT || 80);