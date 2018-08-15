'use strict';
var github = require('octonode');
var GithubGraphQLApi = require('node-github-graphql');
var bluebird = require('bluebird');
var config = require('../config');

var client = github.client();

var github = new GithubGraphQLApi({
    Promise: bluebird,
    token: config.token
});

exports.issues = function (req, res) {
    var owner = req.params.owner;
    var repo = req.params.repo;
    client.get('/repos/' + owner + '/' + repo + '', {}, function (err, status, body, headers) {
        if(err){
            res.send({"msg":"NotFound"});
        }else {
            if (body && body.hasOwnProperty('id')) {

                var closedIssuesPromise = github.query(`query ($owner: String!, $repo : String! ) {
                 repository(owner:$owner, name:$repo) { issues(states:CLOSED) { totalCount } } 
                }`, {'owner': owner , 'repo': repo });

                var openIssuesPromise = github.query(`query ($owner: String!, $repo : String! ) {
                repository(owner:$owner, name:$repo) { issues(states:OPEN) { totalCount } } 
                }`, {
                    'owner': owner , 'repo': repo
                });

                Promise.all([closedIssuesPromise, openIssuesPromise])
                    .then(function (result) {
                        var closedCount = result[0].data.repository.issues.totalCount;
                        var openCount = result[1].data.repository.issues.totalCount;
                        res.send({"closedIssues": closedCount, "openIssues": openCount});
                    })
                    .catch(function (err) {
                        res.send({});
                    });
            } else {
                res.send({});
            }
        }
    });
};