/* globals Promise */

const webdriver = require('selenium-webdriver'),
	By = webdriver.By,
	until = webdriver.until;
const fs = require('fs');

//const all_clients = require('./test_clients.json');
const all_clients = require('./all_clients.json');
const program_updates = require('./program_updates.json');

let i = 0; // Site
let p = 0; // HP Program
let updateJS;

fs.readFile('./console_script.js', 'UTF8', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('console .js file cannot be found');
      return;
    } else {
      throw err;
    }
  }

  updateJS = fd;
});

const driver = new webdriver.Builder()
	.forBrowser('chrome')
	.build();

function sign_in() {
	let sign_in_ready = new Promise(function (resolve, reject) {
		let sign_in_available = driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$username'));
		if (sign_in_available) {
			resolve('Sign in is ready...'); // fulfilled
		} else {
			let reason = new Error('function sign_in() failed');
			reject(reason); // reject
		}
	});

	sign_in_ready.then(function(fulfilled) {
		console.log(fulfilled);
		driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$username')).sendKeys(all_clients.clients[i].admin);
		driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$password')).sendKeys(all_clients.clients[i].password);
		driver.findElement(By.name('ctl00$content$SiteThemeContentFragmentPage1$fragment_3526$ctl01$ctl00$LoginForm1$ctl06$loginButton')).click();
		console.log('Logged in...');
		driver.wait(until.elementLocated(By.css('#otherthings .item-title')), 12000).then(function() {
			let homepage_loaded = driver.findElement(By.css('#otherthings .item-title'));
			locate_tile(homepage_loaded);
		});
	}).catch(function(error) {
		console.log(error.message);
	});
}

function locate_tile(homepage_loaded) {
	let homepage_ready = new Promise(function (resolve,reject) {
    if (homepage_loaded) {
      resolve('Home page is ready...');
		} else {
			let reason = new Error('function locate_tile() failed');
			reject(reason);
    }
	});
	homepage_ready.then(function(fulfilled) {
		console.log(fulfilled);

		driver.findElement(By.css('a[title*="' + program_updates.programs[p].title + '"]')).then(function() {
			console.log(program_updates.programs[p].title + ' tile located...');

			driver.findElement(By.css('a[title*="' + program_updates.programs[p].title + '"]')).click();

			driver.wait(until.elementLocated(By.css('#modal_overlay .description-text')), 12000).then(function() {
				let tile_loaded = driver.findElement(By.css('#modal_overlay .description-text'));
				scrape_tile(tile_loaded);
			});
		}, function(err) {
			console.log('Tile not found. Skipping update and moving onto the next one...');
			if (program_updates.programs[p + 1]) {
				p += 1;
				driver.get('https://mywellmetrics.com/Home');
				driver.wait(until.elementLocated(By.css('#otherthings .item-title')), 12000).then(function() {
					let homepage_loaded = driver.findElement(By.css('#otherthings .item-title'));
					locate_tile(homepage_loaded);
				});
			} else {
				console.log('Finished updating programs');
				p = 0;
				next_site();
			}
		});

	}).catch(function(error) {
		console.log(error.message);
	});
}

function scrape_tile(tile_loaded) {
	let tile_ready = new Promise(function(resolve, reject) {
		if (tile_loaded) {
			resolve('Tile is ready...');
		} else {
			let reason = new Error('function scrape_tile() failed');
			reject(reason);
		}
	});

	tile_ready.then(function(fulfilled) {
		console.log(fulfilled);

		// Replace placeholders in console script
		let updateInstance = updateJS
			.replace(/EMPLOYERNAME/, "'" + all_clients.clients[i].e + "'")
			.replace(/EMPLOYERPSK/, "'" + all_clients.clients[i].psk + "'")
			.replace(/TILETITLE/, "'" + program_updates.programs[p].title + "'")
			.replace(/TILETITLEHTML/, "'" + program_updates.programs[p].title_html + "'")
			.replace(/TILEIMAGEURL/, "'" + program_updates.programs[p].tile_image + "'")
			.replace(/TARGETCLASS/, "'" + program_updates.programs[p].update.target_class + "'")
			.replace(/PROGRAMNAME/, "'" + program_updates.programs[p].update.program_name + "'")
			.replace(/PROGRAMLINK/, "'" + program_updates.programs[p].update.program_link + "'")
			.replace(/PROGRAMIMAGE/, `"${program_updates.programs[p].update.program_image}"`);

		setTimeout(function() {
      driver.executeScript(updateInstance);
    }, 5000);

		driver.wait(until.elementLocated(By.css('a[href="' + program_updates.programs[p].update.program_link + '"]')), 14000).then(function() {
			setTimeout(function() {
				driver.findElement(By.css('a[class="item-info-close"]')).click();
				console.log('Program update complete');
				if (program_updates.programs[p+1]) {
					p++;
					driver.get('https://mywellmetrics.com/Home');
					driver.wait(until.elementLocated(By.css('#otherthings .item-title')), 12000).then(function() {
						let homepage_loaded = driver.findElement(By.css('#otherthings .item-title'));
						locate_tile(homepage_loaded);
					});
				} else {
					console.log('Finished updating programs');
					p = 0;
					next_site();
				}
			}, 5000);
		});
	}).catch(function(error) {
		console.log(error.message);
	});
}

function next_site() {
	driver.get('https://mywellmetrics.com/logout.aspx');
	if (all_clients.clients[i + 1]) {
		i++;
		driver.get('https://mywellmetrics.com/Home')
			.then(function() {
        sign_in();
      });
	} else {
		console.log('All updates are now complete');
		driver.quit();
	}
}

//Execute
driver.get('https://mywellmetrics.com/Home').then(function() {
	sign_in();
});
