/*global React, ReactDOM, setInterval, document, console, setTimeout, Util, window, history, sessionStorage*/

'use strict';

var doc = document;
var container = document.getElementById('container');
var image = document.getElementById('background-img');
var preview = document.getElementById('link-preview');

var PAGES = ['tworoads', 'crossroads', 'portals', 'fountain', 'chasm', 'memex', 'monolith'];
var BASE_URL = 'kadekeith.me/classes/csce444/essaysketch/';

var REFRESH_MESSAGES = ["Please refrain from navigating that way", "Seriously, you might get lost", "This is not how you are supposed to experience my site", "Really?", "Really?", "Really?", "Really?", "Really?", "Really?", "Dang you are persistent", "Really?"];

//odds in % of things happening
var LINK_PREVIEW_CHANCE = 75;
var PREVIEW_CORRECT_CHANCE = 75;
var NAV_CORRECT_CHANCE = 90;
var URL_CORRECT_CHANCE = 75;

/* Set flag so we know first time user visits page */
if (!sessionStorage.getItem("visited")) {
    sessionStorage.setItem("visited", true);
    sessionStorage.setItem("refreshCount", 0);
}

/** returns page chance % of the time. otherwise returns random page */
function maybePage(page, chance) {
    var rand = Util.getRandom(0, 100);
    if (rand < chance) {
        return page;
    } else {
        return Util.getRandomEntry(PAGES);
    }
}

/* Psuedo-Links */

function renderLink() {
    return React.createElement(
        'div',
        { className: 'link', onClick: this.handleClick, onMouseOver: this.handleMouseOver, onMouseOut: this.handleMouseOut },
        this.props.text
    );
}

function showLinkPreview() {
    var rand = Util.getRandom(0, 100);
    if (rand > LINK_PREVIEW_CHANCE) {
        return;
    }

    preview.style.display = "block";
    preview.innerHTML = BASE_URL + maybePage(this.props.target, PREVIEW_CORRECT_CHANCE);
}

function hideLinkPreview() {
    preview.style.display = "none";
}

var ChoiceLink = React.createClass({
    displayName: 'ChoiceLink',

    handleClick: function handleClick(event) {
        var xDelt = window.innerWidth / 2 - event.clientX;
        var yDelt = 310 - (event.clientY - 50);
        image.style.transition = '1s ease';
        image.style.transform = 'scale(1.3, 1.3) translate(' + xDelt / 4 + 'px,' + yDelt / 4 + 'px)';
        loadPage(this.props.target, 1500);
        hideLinkPreview();
    },
    handleMouseOver: showLinkPreview,
    handleMouseOut: hideLinkPreview,
    render: renderLink
});

var LandmarkLink = React.createClass({
    displayName: 'LandmarkLink',

    handleClick: function handleClick(event) {
        loadPage(this.props.target, 600);
        hideLinkPreview();
    },
    handleMouseOver: showLinkPreview,
    handleMouseOut: hideLinkPreview,
    render: renderLink
});

/* Perceived Choice Nodes */

var TwoRoadsNode = React.createClass({
    displayName: 'TwoRoadsNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'perceived-choice' },
            React.createElement(
                'div',
                { className: 'left-path choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Left Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.leftRoadTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'div',
                { className: 'right-path choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Right Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.rightRoadTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'p',
                { className: 'main-text' },
                'Two roads diverge in the wood. Beyond the direction ',
                React.createElement('br', null),
                'they lead, there is no discernable difference between the two.'
            )
        );
    }
});

var CrossRoadsNode = React.createClass({
    displayName: 'CrossRoadsNode',

    //TODO {this.props.northwestTarget}
    //add image to landmark maybe

    render: function render() {
        return React.createElement(
            'article',
            { className: 'perceived-choice' },
            React.createElement(
                'div',
                { className: 'northwest-path choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Northwest Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.northwestTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'div',
                { className: 'northeast-path choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Northeast Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.northeastTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'div',
                { className: 'east-path choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'East Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.eastTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'p',
                { className: 'main-text' },
                'You approach a crossroads marked by a signpost. There are three options, ',
                React.createElement('br', null),
                'a northwest path, a northeast path, and an east path.'
            )
        );
    }
});

//sends user random place
var PortalsNode = React.createClass({
    displayName: 'PortalsNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'perceived-choice' },
            React.createElement(
                'div',
                { className: 'left-portal choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Left Portal'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.leftTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'div',
                { className: 'middle-portal choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Middle Portal'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.middleTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'div',
                { className: 'right-portal choicenav' },
                React.createElement(
                    'div',
                    { className: 'path-lbl' },
                    'Right Portal'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: maybePage(this.props.rightTarget, NAV_CORRECT_CHANCE) })
            ),
            React.createElement(
                'p',
                { className: 'main-text' },
                'There are three portals in the forest. They are large enough to walk through, ',
                React.createElement('br', null),
                'but it is not clear what lies on the other side.'
            )
        );
    }
});

/* Landmark Nodes */

var FountainNode = React.createClass({
    displayName: 'FountainNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                { className: 'main-text' },
                'You see a large urinal in a clearing. The name "R. Mutt" has been written on it. ',
                React.createElement('br', null),
                'On the ground you see a plaque with the inscription, "Artist: Marcel Duchamp. Submitted by: unidan"'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Back', target: maybePage(this.props.backTarget, NAV_CORRECT_CHANCE) }),
                React.createElement(LandmarkLink, { text: 'Go Forward', target: maybePage(this.props.forwardTarget, NAV_CORRECT_CHANCE) })
            )
        );
    }
});

var ChasmNode = React.createClass({
    displayName: 'ChasmNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                { className: 'main-text' },
                'A great chasm lies before you. On one side is a sign reading "Information" ',
                React.createElement('br', null),
                'On the other is a sign reading "Knowledge"'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Left', target: maybePage(this.props.leftTarget, NAV_CORRECT_CHANCE) }),
                React.createElement(LandmarkLink, { text: 'Go Right', target: maybePage(this.props.rightTarget, NAV_CORRECT_CHANCE) })
            )
        );
    }
});

var MemexNode = React.createClass({
    displayName: 'MemexNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                { className: 'main-text' },
                'You come up to a convoluted machine. It is a mass of wires and buttons with one primary screen ',
                React.createElement('br', null),
                'It appears as though the wires are meant to connect pieces of data together. ',
                React.createElement('br', null),
                'There is a plaque on the top of the machine that reads "Memex: Write your own adventure"'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Left', target: maybePage(this.props.leftTarget, NAV_CORRECT_CHANCE) }),
                React.createElement(LandmarkLink, { text: 'Go Forward', target: maybePage(this.props.forwardTarget, NAV_CORRECT_CHANCE) }),
                React.createElement(LandmarkLink, { text: 'Go Right', target: maybePage(this.props.rightTarget, NAV_CORRECT_CHANCE) })
            )
        );
    }
});

var MonolithNode = React.createClass({
    displayName: 'MonolithNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                { className: 'main-text' },
                'A coal black obelisk towers above you. ',
                React.createElement('br', null),
                'Its exterior is impenetrable and you cannot discern anything about its makeup. ',
                React.createElement('br', null),
                'You feel as though it is compelling you to move in a certain direction.'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Left', target: maybePage(this.props.leftTarget, NAV_CORRECT_CHANCE) }),
                React.createElement(LandmarkLink, { text: 'Go Forward', target: maybePage(this.props.forwardTarget, NAV_CORRECT_CHANCE) }),
                React.createElement(LandmarkLink, { text: 'Go Right', target: maybePage(this.props.rightTarget, NAV_CORRECT_CHANCE) })
            )
        );
    }
});

/* Page Transitions */

//there should be a realistic delay
function loadPage(page, delay) {
    Util.deleteChildren(container);
    setTimeout(renderPage, delay, page);
}

/** choices */
function renderPage(page) {
    image.style.transition = "";
    image.style.transform = "";
    history.pushState({}, null, maybePage(page, URL_CORRECT_CHANCE));
    switch (page) {
        case 'tworoads':
            image.src = "img/compressed/tworoads-crop.jpg";
            ReactDOM.render(React.createElement(TwoRoadsNode, { leftRoadTarget: 'fountain', rightRoadTarget: 'fountain' }), container);
            break;
        case 'crossroads':
            image.src = "img/compressed/crossroads-crop.jpg";
            ReactDOM.render(React.createElement(CrossRoadsNode, { northwestTarget: 'fountain', northeastTarget: 'chasm', eastTarget: 'memex' }), container);
            break;
        case 'portals':
            image.src = "img/compressed/portals-crop.jpg";
            ReactDOM.render(React.createElement(PortalsNode, { leftTarget: 'monolith', middleTarget: Util.getRandomEntry(PAGES), rightTarget: 'chasm' }), container);
            break;
        //landmarks
        case 'fountain':
            image.src = "img/compressed/fountain-crop.jpg";
            ReactDOM.render(React.createElement(FountainNode, { backTarget: 'tworoads', forwardTarget: 'crossroads' }), container);
            break;
        case 'chasm':
            image.src = "img/compressed/chasm-crop.jpg";
            ReactDOM.render(React.createElement(ChasmNode, { leftTarget: 'portals', rightTarget: 'memex' }), container);
            break;
        case 'memex':
            image.src = "img/compressed/memex-crop.jpg";
            ReactDOM.render(React.createElement(MemexNode, { leftTarget: 'monolith', forwardTarget: 'crossroads', rightTarget: 'tworoads' }), container);
            break;
        case 'monolith':
            image.src = "img/compressed/monolith-crop.jpg";
            ReactDOM.render(React.createElement(MonolithNode, { leftTarget: 'portals', forwardTarget: 'crossroads', rightTarget: 'memex' }), container);
            break;
        default:
            console.log('something went wrong. defaulting to portals');
            image.src = "img/compressed/portals-crop.jpg";
            ReactDOM.render(React.createElement(PortalsNode, { leftTarget: Util.getRandomEntry(PAGES), middleTarget: Util.getRandomEntry(PAGES), rightTarget: Util.getRandomEntry(PAGES) }), container);
            break;
    }
}

/* Start navigation */

function start() {
    renderPage('tworoads');
}

window.onbeforeunload = function () {
    var count = parseInt(sessionStorage.getItem("refreshCount"));
    if (count < REFRESH_MESSAGES.length - 1) {
        sessionStorage.setItem("refreshCount", count + 1);
        console.log(count);
    }
    return REFRESH_MESSAGES[count];
};