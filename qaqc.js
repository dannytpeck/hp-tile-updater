/* globals Promise */

const webdriver = require('selenium-webdriver'),
	By = webdriver.By,
	until = webdriver.until;
const fs = require('fs');
const moment = require('moment');

//const obj = require('./test_clients.json');
const obj = require('./all_clients.json');
const pgr = require('./program_updates.json');

let updateJS;

fs.readFile('./hp_logs/hp_log_' + moment().format('YYYYMMDD') + '.md', 'UTF8', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('log file does not exist...creating log file');
      if (!fs.existsSync('./hp_logs')) {
        fs.mkdirSync('./hp_logs');
				console.log('created "hp_logs" directory');
			} else {
        console.log('"hp_logs" directory exists');
			}
			fs.writeFile('./hp_logs/hp_log_' + moment().format('YYYYMMDD') + '.md', '# Error Log for HP Class Assignment Update ' + moment().format('YYYYMMDD'), function(err) {
				if (err) {
					console.log(err);
					return;
				}
				console.log('Log file created in "/hp_logs"');
			});
      return;
    } else {
      throw err;
    }
  }
});

const driver = new webdriver.Builder()
	.forBrowser('chrome')
	.build();

//i is site
let i = 0;

//p is hp program
let p = 0;

//Execute
driver.get('https://mywellmetrics.com/Home').then(function() {
  sign_in();
});

// Promise Consumption
function sign_in() {
	let sign_in_ready = new Promise(function (resolve, reject) {
		let sign_in_available = driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$username'));
		if (sign_in_available) {
			resolve('sign in is ready...'); // fulfilled
		} else {
			let reason = new Error('QC function sign_in() failed');
			reject(reason); // reject
		}
	});

	sign_in_ready.then(function(fulfilled) {
		console.log(fulfilled);
		driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$username')).sendKeys(obj.clients[i].admin);
		driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$password')).sendKeys(obj.clients[i].password);
		driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$loginButton')).click();
		console.log('	logged in...');
		console.log('====================================');
		driver.wait(until.elementLocated(By.css('#otherthings .item-title')), 12000).then(function() {
			let homepage_loaded = driver.findElement(By.css('#otherthings .item-title'));
			locate_tile(homepage_loaded);
		});
	}).catch(function(error) {
		console.log(error.message);
	});
}

function locate_tile(homepage_loaded) {
	let homepage_ready = new Promise(function (resolve, reject) {
		if (homepage_loaded) {
			resolve('homepage is ready...');
		} else {
			let reason = new Error('QC function locate_tile() failed');
			reject(reason);
		}
	});

	homepage_ready.then(function(fulfilled) {
		console.log(fulfilled);
		console.log('Reviewing ' + pgr.programs[p].title + '...');

		driver.findElement(By.css('a[title*="' + pgr.programs[p].title + '"]')).then(function() {
			driver.findElement(By.css('a[title*="' + pgr.programs[p].title + '"]')).click();
			driver.wait(until.elementLocated(By.css('#modal_overlay .description-text div p')), 12000).then(function() {
				let tile_loaded = driver.findElement(By.css('#modal_overlay .description-text div p'));
				scrape_tile(tile_loaded);
			});
		}, function(err) {
			console.log('Tile not found. Skipping update and moving onto the next one...');
			resume_checks();
		});

	}).catch(function(error) {
		console.log(error.message);
	});

}

function scrape_tile(tile_loaded) {
	let tile_ready = new Promise(function(resolve,reject) {
		if (tile_loaded) {
			resolve('	tile is ready...');
		} else {
			let reason = new Error('QC function scrape_tile() failed');
			reject(reason);
		}
	});

	tile_ready.then(function(fulfilled) {
		console.log('	Performing link and element inspections...');
		let registration = driver.findElement(By.css('a[href="' + pgr.programs[p].update.program_link + '"]'));
		let sidepanel = driver.findElement(By.css('.side_links'));
		let details = '';
		sidepanel.then(function() {
			console.log('		...side_links found [passed]');
			details += '\n    - [success] side_links found';
		}).catch(function() {
			console.log('		...side_links not found [failed]');
			details += '\n    - [!failure!] side_links not found';
		});
		registration.then(function() {
			console.log('		...registration link found [passed]');
			details += '\n    - [success] registration link found';
			registration.click();

			setTimeout(function() {
				driver.getAllWindowHandles().then(function(handles) {
					driver.switchTo().window(handles[1]);
					driver.wait(until.titleIs('Coaching : Choose Event'), 5000)
						.then(function() {
							console.log('		...registration page loaded!');
							details += '\n    - [success] registration page loaded';
							driver.close();
							driver.switchTo().window(handles[0]);
							console.log('		...returned to Limeade');
							update_log(details);
							console.log('	Element inspection logged...');
							user_review();
						}).catch(function() {
							driver.getTitle();
								console.log('		...failed to load registration page. Check SF Config.');
								details += '\n    - [!failure!] registration page not loaded; may not be configured';
								driver.close();
								driver.switchTo().window(handles[0]);
								console.log('		...returned to Limeade');
								update_log(details);
								console.log('	Element inspection logged...');
								user_review();
						});
				});
			}, 2500);
		}).catch(function() {
			console.log('		...registration link not found [failed]');
			details += '\n    - [!failure!] registration link not found';
			update_log(details);
			console.log('	Element inspection logged...');
			user_review();
		});
	}).catch(function(error) {
		console.log(error.message);
	});
}

function update_log(details) {
	let log_description = '  - '
		+ '[INFO: | ' + moment().format() + ']'
		+ obj.clients[i].admin + ' element inspection summary @ '
		+ pgr.programs[p].title
		+ details;
	fs.appendFile('./hp_logs/hp_log_' + moment().format('YYYYMMDD') + '.md', '\n' + log_description, function(err) {
		if (err) {
			return console.log(err);
		}
	});
}

function user_review() {
	console.log('	Performing visual inspection...');
	console.log('	Does tile pass visual inspection?');
	console.log('		Type "yes" to continue');
	console.log('		Type "no" to log visual inspection failure');
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	var util = require('util');

  function handleYes() {
    console.log('		...continue');
    //process.removeListener('data',this);
    let log_description = '  - '
      + '[INFO: | ' + moment().format() + ']'
      + obj.clients[i].admin + ' passed visual inspection @ '
      + pgr.programs[p].title;
    fs.appendFile('./hp_logs/hp_log_'
      + moment().format('YYYYMMDD')
      + '.md', '\n' + log_description, function(err) {
      if (err) {
        return console.log(err);
      }
    });
    driver.findElement(By.css('a[class="item-info-close"]')).click();
    resume_checks();
  }

  handleYes();

}

function resume_checks() {
	console.log('====================================');
	if (pgr.programs[p + 1]) {
		p++;
		driver.wait(until.elementLocated(By.css('#otherthings .item-title')), 12000)
		.then(function() {
			let homepage_loaded = driver.findElement(By.css('#otherthings .item-title'));
			locate_tile(homepage_loaded);
		});
	} else {
		console.log('Finished updating programs');
		p = 0;
		next_site();
	}
}

function next_site() {
	driver.get('https://mywellmetrics.com/logout.aspx');
	if (obj.clients[i + 1]) {
		i++;
		driver.get('https://mywellmetrics.com/Home').then(function() {
      sign_in();
    });
	} else {
		console.log('QC is complete on all platforms');
		console.log('Review your logged states and errors "/hp_logs/hp_log' + moment().format('YYYYMMDD') + '.md"');
		driver.quit();
	}
}
