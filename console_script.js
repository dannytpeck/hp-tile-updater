// Placeholder variables that get replaced in Node
/* eslint-disable no-undef */
const employerName = EMPLOYERNAME;
const employerPsk = EMPLOYERPSK;
const tileTitle = TILETITLE;
const tileTitleHtml = TILETITLEHTML;
const tileImageUrl = TILEIMAGEURL;
const targetClass = TARGETCLASS;
const programName = PROGRAMNAME;
const programLink = PROGRAMLINK;
const programDesc = PROGRAMDESC;
/* eslint-enable no-undef */

// All the changes to the HP Tiles occur here. Edit as needed
function updateHtml() {
  const tileDescription = document.querySelector('.description-text');
	const originalHtml = tileDescription.innerHTML;

  const lifestyleFundamentalsSidebar = document.querySelectorAll('.hp_sidepanel p')[0];
  const personalPerformanceSidebar = document.querySelectorAll('.hp_sidepanel p')[1];

	const registrationLinkHtml = '<a style="text-decoration:underline" href="' + programLink + '" target="_new">' + programName + '</a>';

  // Update registration link and short description from JSON file
  const coachingProgram = document.querySelector('p[class*="' + targetClass + '"]');
  if (coachingProgram) {
    coachingProgram.querySelector('.hp_short').innerHTML = programDesc;
    coachingProgram.querySelector('strong').innerHTML = registrationLinkHtml;
  }

  /* Commenting out since Fast Fitness is being postponed to January
  // TODO: Add Fast Fitness to Personal Performance sidebar
  if (programName === 'Fast Fitness') {
    if (personalPerformanceSidebar.innerHTML.includes(programName)) {
      console.log('Link present in list; Update was already applied.');
    } else {
      personalPerformanceSidebar.innerHTML += '<br>' + registrationLinkHtml;

      // If present, remove the Coming in 2017 text, since we just added a coaching program
      personalPerformanceSidebar.innerHTML = personalPerformanceSidebar.innerHTML.replace('<em>Coming in 2017</em><br>', '');
    }
  }
  */


  // TODO: Add Adventures in Parenting to the tile in both places
  if (programName === 'Adventures in Parenting') {

    // Confirm we're on the Growth tile and that it doesn't contain Adventures coaching program
    if (originalHtml.includes('Growth') && !originalHtml.includes('Adventures')) {

      // Grab the Leadership Development program
      const leadershipP = document.querySelector('.leadership_d');

      // Create p tag for the new program
      let p = document.createElement('p');
      p.className = targetClass;
      p.innerHTML = '<strong>' + registrationLinkHtml + '</strong><br><span class="hp_short">' + programDesc + '</span>';

      // Insert program after Leadership Development p tag
      document.querySelector('.hp_scrollbox').insertBefore(p, leadershipP.nextSibling);

      // Insert Link after the other links in the appropriate sidebar
      if (personalPerformanceSidebar.innerHTML.includes(programName)) {
        console.log('Link present in list; Update was already applied.');
      } else {
        personalPerformanceSidebar.innerHTML += '<br>' + registrationLinkHtml;
      }

    }

  }


	// Only move to the next step if the html has been changed by the updates
  const updatedHtml = tileDescription.innerHTML;
  if (updatedHtml !== originalHtml) {
    getInfo(updatedHtml);
  }

}

// Obtains id, displaypriority, and point value. Uses updated values to send
// an upload request to Limeade
function getInfo(updatedHtml) {
  const cieValues = [
    employerName,,tileTitle,,'IncentivePoints',0,,0,0,
    0,1,0,0,0,,,tileImageUrl,1,,,,,,,,,,,,,
  ];

	const nodes = [].slice.call(document.querySelectorAll('#otherthings .item-title'));
	const url = window.location.href;
	const id = url.substring(url.search('=') + 1, url.length);

	let points;
  try {
    points = document.querySelector('.info-reward span').innerText;
  } catch (e) {
    points = 0;
  }

	let priority;
	nodes.map((tile, i) => {
		if (tile.querySelector('h3').innerHTML === tileTitleHtml) {
			priority = i + 1;
		}
	});
	cieValues[1] = id;
	cieValues[3] = priority;
	cieValues[5] = points;
  cieValues[23] = sanitize(updatedHtml);
	upload(cieValues);
}

// Sends CSV data to Limeade
function upload(cieValues) {
  const cieHeaders = [
    'EmployerName', 'EventId', 'EventName', 'DisplayPriority', 'RewardType',
    'PointsAwarded', 'RewardDescription', 'AllowSameDayDuplicates', 'IsOngoing',
    'IsDisabled', 'ShowInProgram', 'IsSelfReport', 'DataFeedMode', 'Notify',
    'ButtonText', 'TargetUrl', 'EventImageUrl', 'MaxOccurrences', 'StartDate',
    'EndDate', 'ViewPages', 'Dimensions', 'ShortDescription', 'HtmlDescription',
    'SubgroupId', 'Field1Name', 'Field1Value', 'Field2Name', 'Field2Value',
    'Field3Name', 'Field3Value'
  ];

	// API endpoint relative url
	var url = '/api/Upload';

	// Parameters as an object
	var params = {
		e: employerName,
		psk: employerPsk,
		type: 'IncentiveEvents',
		format: 'CSV',
		response: 'JSON',
		debug: true,
		data: cieHeaders.join() + '\n' + cieValues.join()
	};

  /* global $ used for post */
	$.post(url, params).done((data) => {
		// This is the response callback, put things meant to happen
		// after the request receives a response here.
		console.log(data);
	});

}

// Helper function that replaces characters that cause issues in the platform
function sanitize(code) {
  return code
    .replace(/\r?\n|\r/g, ' ')     // Strip out carriage returns and newlines
    .replace(/\,/g, '&#44;')       // Escape commas since we're using a csv
    .replace(/\u2018/g, '\'')      // Left single quote
    .replace(/\u2019/g, '\'')      // Right single quote
    .replace(/\u201C/g, '\"')      // Left double quote
    .replace(/\u201D/g, '\"')      // Right double quote
    .replace(/\u2026/g, '...')     // Ellipsis
    .replace(/\u2013/g, '&ndash;') // Long dash
    .replace(/\u2014/g, '&mdash;') // Longer dash
    .replace(/\u00A9/g, '&copy;'); // Copyright symbol
}

updateHtml();
