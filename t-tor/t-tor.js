#!/usr/bin/env node

var express	 = require('express'),
	request  = require('request'),
	cheerio  = require('cheerio'),
	open     = require("open"),
	inquirer = require('inquirer'),
	program  = require('commander'),
	https 	 = require('https'),
	colors	 = require('colors');

var hydra    = ['https://thepiratebay.se/',
				'https://thepiratebay.la/',
				'https://thepiratebay.mn/',
				'https://thepiratebay.gd/'];

//make sure that we go to a working pirate bay address
Promise.race(hydra.map(function(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      resolve(url);
    }).on('error', function(err) {
    
    });
  });
})).then(function (besturl) {
	var test = 'https://thepiratebay.se/';
	makeUrl(test);
});

//list t-tor options and get input option ready to search
program
	.option('-a, --audio', '100')
	.option('-v, --video', '200')
	.option('-A, --applications', '300')
	.option('-g, --games', '400')
	.option('-p, --porn', '500')
	.option('-o, --other', '600')
	.parse(process.argv);

function parseSearch (index) {
	var search = [];
	for (i in program.args) {
		search[i] = program.args[i].replace(/ /g, '%20');
	}
	return search;
}

//make final url to get list
function makeUrl(url, index){
	var searchOptions = '',
		finalUrl = '';
 
	if (program.audio) searchOptions 		= searchOptions + '100,';
	if (program.video) searchOptions 		= searchOptions + '200,';
	if (program.applications) searchOptions = searchOptions + '300,';
	if (program.games) searchOptions 		= searchOptions + '400,';
	if (program.porn) searchOptions 		= searchOptions + '500,';
	if (program.other) searchOptions 		= searchOptions + '600,';

	finalUrl = url + 'search/' + parseSearch() + '/0/99/' + searchOptions;
    finalUrl = finalUrl.substring(0, finalUrl.length - 1);
	torList(finalUrl);
}

//get list of torrents
function torList (url) {
	request(url, function (error, respsonse, html){
		var title = [],
			date = [],
			type = [],
			magnet = [],
			seeds = [],
			leech = [],
			options = [];

		if (!error) {
			var $ = cheerio.load(html, {
				normalizeWhitespace: true
			});
			
			for (i = 0; i < $('#searchResult').children().length; i++){
				$('#searchResult').children().eq(i + 1).filter(function(){
					var data = $(this).children();
						magnet[i] = magnetSlice(data.eq(1).html());
						seeds[i]  = data.eq(2).html();
						leech[i]  = data.eq(3).html();
						title[i]  = data.eq(1).children().first().text().replace(/ /g, '');
						date[i]   = data.eq(1).children().last().text().replace(/ /g, '');
						type[i]   = data.eq(0).text().replace(/ /g, '');
						options[i] = title[i] + ' ' + type[i] + ' le:'.red + leech[i].red + ' se:'.red + seeds[i].red + ' ' + date[i];
				})
			}
			genList (options, magnet);
		}
	})
}

//slice out the magnetic link
function magnetSlice (str){
	if (str != null) {
		var start = str.indexOf('magnet'),
		    end = str.indexOf('" ', start),
		    link = str.slice(start, end);
		return link;
	}
}

//generate the list 
function genList (choices, magnet) {
	inquirer.prompt([
	  {
	    type      : "list",
	    name      : "tor",
	    message   : "Results",
	    paginated : true,
	    choices   : choices,
	  }
	], function(answer) {
	  for (i in choices) {
	  	if (answer.tor == choices[i]) {
	  		open(magnet[i]);
	  		{ break; }
	  	}
	  }
	});
}
