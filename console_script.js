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
const programImage = PROGRAMIMAGE;
/* eslint-enable no-undef */

// All the changes to the HP Tiles occur here. Edit as needed
function updateHtml() {
  const tileDescription = document.querySelector('.description-text');
	const originalHtml = tileDescription.innerHTML;

  // Grab the coaching programs container
  const coachingProgramsContainer = document.querySelector('.coaching-programs-container');

  //// BEGIN Operation Destroyer updates - remove after 2/23/2018 updates ////

  // BEGIN Coaching content text updates //
  const newFocusedText = 'Start by clicking one of our focused 6-week Paths below';
  const newDetailsText = 'flag! Each features six interactive sessions along with weekly surveys (completion required to earn points).';

  tileDescription = tileDescription.replace('Start by clicking one of our focused Paths below', newFocusedText);
  tileDescription = tileDescription.replace('flag!', newDetailsText);

  // END Coaching content text updates //

  // BEGIN move group coaching CTA //



  // END move group coaching CTA //



  //// END Operation Destroyer updates ////


  //// BEGIN add coaching program ////
  // Create the new program HTML
  const programHtml = `
    <div class="coaching-program-callout ${targetClass}" style="margin-bottom: 20px;">
      <a href="${programLink}" target="_blank">
        <img src="${programImage}" alt="" style="width: 100%">
      </a>
    </div>
  `;

  // Only add the new program if it doesn't already exist
  if (targetClass !== 'undefined' && !originalHtml.includes(targetClass)) {
    coachingProgramsContainer.innerHTML += programHtml;
  }
  //// END add coaching program ////

	// Only move to the next step if the html has been changed by the updates
  const updatedHtml = tileDescription.innerHTML;
  if (updatedHtml !== originalHtml) {
    pushToLimeade(updatedHtml);
  }

}

// Obtains id, displaypriority, and point value. Uses updated values to send
// an upload request to Limeade
function pushToLimeade(updatedHtml) {
	const nodes = [].slice.call(document.querySelectorAll('#otherthings .item-title'));
	const url = window.location.href;
	const eventId = url.substring(url.search('=') + 1, url.length);

	let pointsAwarded;
  try {
    pointsAwarded = document.querySelector('.info-reward span').innerText.replace(',', '');
  } catch (e) {
    pointsAwarded = 0;
  }

	let displayPriority;
	nodes.map((tile, i) => {
		if (tile.querySelector('h3').innerHTML === tileTitleHtml) {
			displayPriority = i + 1;
		}
	});

  const cieValues = [
    employerName,
    eventId,
    tileTitle,
    displayPriority,
    'IncentivePoints',
    pointsAwarded,
    '',
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    '',
    '',
    tileImageUrl,
    1,
    '',
    '',
    '',
    '',
    '',
    sanitize(updatedHtml),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ];

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
