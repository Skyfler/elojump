"use strict";

var FormTemplate = require('./formTemplate');
var TierImageController = require('./boostController-tierImage');
var OptionsVisibilityController = require('./boostController-optionsVisibility');
var ValueDisplay = require('./boostController-valueDisplay');
var _bcHelper = require('./boostController-helper');

function DuoBoostController(options) {
    FormTemplate.call(this, options);

    this._currentTierWeight = 0;
    this._desiredNumber = 0;

    this._getCustomInputs();
    this._createOptionsVisibilityControllers();
    this._createImageControllers();
    this._createValueDisplays();

    this._setTier(
        'current',
        _bcHelper.LEAGUES.br.name,
        _bcHelper.DIVISIONS.d5.name
    );

    this._onCustomSelect = this._onCustomSelect.bind(this);
    this._onCustomInputRange = this._onCustomInputRange.bind(this);

    this._addListener(this._elem, 'customselect', this._onCustomSelect);
    this._addListener(this._elem, 'custominputrangeslide', this._onCustomInputRange);
    this._addListener(this._elem, 'custominputrangechange', this._onCustomInputRange);

    this._serverSelect.setOption({value: _bcHelper.SERVERS.eu.name});
    this._numberInputRange.setValue(5);
    this._suffixSelect.setOption({value: _bcHelper.GAMES_OR_WINS.gms.name});
    this._currentLeagueSelect.setOption({value: _bcHelper.LEAGUES.br.name});
    this._currentDivisionSelect.setOption({value: _bcHelper.DIVISIONS.d5.name});
}

DuoBoostController.prototype = Object.create(FormTemplate.prototype);
DuoBoostController.prototype.constructor = DuoBoostController;

DuoBoostController.prototype.remove = function() {
    this._destroyImageControllers();
    this._destroyOptionsControllers();
    this._destroyValueDisplays();

    FormTemplate.prototype.remove.apply(this, arguments);
};

DuoBoostController.prototype._destroyImageControllers = function() {
    if (this._currentTierImageController) {
        this._currentTierImageController.remove();
    }
};

DuoBoostController.prototype._destroyValueDisplays = function() {
    if (this._numberDisplay) {
        this._numberDisplay.remove();
    }

    if (this._descriptionDisplay) {
        this._descriptionDisplay.remove();
    }

    if (this._priceDisplay) {
        this._priceDisplay.remove();
    }
};

DuoBoostController.prototype._destroyOptionsControllers = function() {
    if (this._currentLeagueOptionsController) {
        this._currentLeagueOptionsController.remove();
    }

    if (this._currentDivisionOptionsController) {
        this._currentDivisionOptionsController.remove();
    }
};

DuoBoostController.prototype._getCustomInputs = function() {
    var customInput;

    for (var i = 0; i < this._customSelectArr.length; i++) {
        customInput = this._customSelectArr[i].getElem();

        if (customInput.matches('#duo-server-select')) {
            // console.log('_currentLeagueSelect found!');
            this._serverSelect = this._customSelectArr[i];

        } else if (customInput.matches('#duo-games-wins-select')) {
            // console.log('_currentDivisionSelect found!');
            this._suffixSelect = this._customSelectArr[i];

        } else if (customInput.matches('#duo-current-league-select')) {
            // console.log('_currentLeagueSelect found!');
            this._currentLeagueSelect = this._customSelectArr[i];

        } else if (customInput.matches('#duo-current-division-select')) {
            // console.log('_currentDivisionSelect found!');
            this._currentDivisionSelect = this._customSelectArr[i];

        }
    }

    for (i = 0; i < this._customInputRangeArr.length; i++) {
        customInput = this._customInputRangeArr[i].getElem();

        if (customInput.matches('#duo-number-range')) {
            // console.log('_currentLeagueSelect found!');
            this._numberInputRange = this._customInputRangeArr[i];

        }
    }
};

DuoBoostController.prototype._setTier = function(prefix, leagueName, divisionName) {
    if (!prefix || prefix !== 'current') return;

    var leagueObj = _bcHelper.findLeagueByName(leagueName),
        divisionObj = _bcHelper.findDivisionByName(divisionName);
    // console.log(currentLeagueObj);

    if (!leagueObj || !divisionObj) return;

    this['_' + prefix + 'League'] = leagueObj.name;

    if (
        leagueObj === _bcHelper.LEAGUES.unr ||
        leagueObj === _bcHelper.LEAGUES.ms ||
        leagueObj === _bcHelper.LEAGUES.chg
    ) {
        if (divisionObj !== _bcHelper.DIVISIONS.d1) {
            this['_' + prefix + 'DivisionSelect'].setOption({value: _bcHelper.DIVISIONS.d1.name});

            return false;
        }
    }
    // console.log(currentDivisionObj);

    // console.log('Setting ' + prefix + ' Tier');
    // console.log('League  = ' + leagueObj.name);
    // console.log('Division  = ' + divisionObj.name);


    this['_' + prefix + 'Division'] = divisionObj.name;

    this['_' + prefix + 'TierWeight'] = leagueObj.weight + divisionObj.weight;

    this['_' + prefix + 'TierImageController'].setImage(this['_' + prefix + 'League'], this['_' + prefix + 'Division']);

    return true;
};

DuoBoostController.prototype._setTierAndCheck = function(prefix, leagueName, divisionName) {
    if (!prefix || prefix !== 'current') return;

    if (this._setTier(prefix, leagueName, divisionName)) {
        this._checkOptions();
    }
};

DuoBoostController.prototype._checkOptions = function() {
    // console.log('_checkOptions');

    if (
        this._currentLeague === _bcHelper.LEAGUES.unr.name ||
        this._currentLeague === _bcHelper.LEAGUES.ms.name ||
        this._currentLeague === _bcHelper.LEAGUES.chg.name
    ) {
        // console.log('this._currentLeague has 1 division');
        this._currentDivisionOptionsController.showOptions(
            _bcHelper.DIVISIONS.d1.name,
            _bcHelper.DIVISIONS.d1.name,
            true
        );
    } else {
        // console.log('this._currentLeague has 5 divisions');
        this._currentDivisionOptionsController.showOptions(
            _bcHelper.DIVISIONS.d5.name,
            _bcHelper.DIVISIONS.d1.name
        );
    }
};

DuoBoostController.prototype._onCustomSelect = function(e) {
    var target = e.target;
    var value = e.detail.value;

    if (target === this._currentLeagueSelect.getElem()) {
        this._setTierAndCheck('current', value, this._currentDivision);

    } else if (target === this._currentDivisionSelect.getElem()) {
        this._setTierAndCheck('current', this._currentLeague, value);

    } else if (target === this._serverSelect.getElem()) {
        this._setServer(value);

    } else if (target === this._suffixSelect.getElem()) {
        this._setNumberSuffix(value);

    }

    this._displayCalculatedValues();
};

DuoBoostController.prototype._onCustomInputRange = function(e) {
    var target = e.target;
    var value = e.detail.value;

    if (target === this._numberInputRange.getElem()) {
        this._setWins(value);

    }

    this._displayCalculatedValues();
};

DuoBoostController.prototype._setServer = function(server) {
    if (_bcHelper.SERVERS.hasOwnProperty(server)) {
        this._server = server;
    }
};

DuoBoostController.prototype._setNumberSuffix = function(suffix) {
    if (_bcHelper.GAMES_OR_WINS.hasOwnProperty(suffix)) {
        this._numberSuffix = _bcHelper.GAMES_OR_WINS[suffix].name;
        this._numberDisplay.setSuffix(' ' + _bcHelper.GAMES_OR_WINS[suffix].title);
        this._numberDisplay.showValue(this._desiredNumber);
    }
};

DuoBoostController.prototype._setWins = function(value) {
    this._desiredNumber = value;
    this._numberDisplay.showValue(this._desiredNumber);
};

DuoBoostController.prototype._createImageControllers = function() {
    var currentTierImage = this._elem.querySelector('#duo-current-tier');
    this._currentTierImageController = new TierImageController({
        imageElem: currentTierImage
    });
};

DuoBoostController.prototype._createValueDisplays = function() {
    var numberDisplay = this._elem.querySelector('#duo-display');
    this._numberDisplay = new ValueDisplay({
        displayElem: numberDisplay
    });

    var descriptionDisplay = this._elem.querySelector('.display_description');
    this._descriptionDisplay = new ValueDisplay({
        displayElem: descriptionDisplay,
        prefix: 'Duoq Boost: '
    });

    var priceDisplay = this._elem.querySelector('.display_price');
    this._priceDisplay = new ValueDisplay({
        displayElem: priceDisplay,
        prefix: 'Total Cost: <strong>',
        suffix: '&euro;</strong>'
    });
};

DuoBoostController.prototype._createOptionsVisibilityControllers = function() {
    this._currentLeagueOptionsController = new OptionsVisibilityController({
        selectElem: this._currentLeagueSelect.getElem(),
        optionsGroup: 'LEAGUES'
    });

    this._currentDivisionOptionsController = new OptionsVisibilityController({
        selectElem: this._currentDivisionSelect.getElem(),
        optionsGroup: 'DIVISIONS'
    });
};

DuoBoostController.prototype._displayCalculatedValues = function() {
    this._descriptionDisplay.showValue(this._createDescription());
    this._priceDisplay.showValue(Math.floor(this._getTotalPrice()));
};

DuoBoostController.prototype._getTotalPrice = function() {
    if (!this._currentLeague || !this._numberSuffix || !this._desiredNumber) {
        return 0;
    }

    return this._totalPriceDuoQBoost(this._currentLeague, this._numberSuffix, this._desiredNumber);
};

DuoBoostController.prototype._totalPriceDuoQBoost = function (currentLeagueName, gamesOrWins, desiredNumber) {
    // console.log(currentLeagueName + ' ' + gamesOrWins + ' ' + desiredNumber);
    var one = desiredNumber % 10;
    var ten = (desiredNumber - one) / 10;

    return _bcHelper.DUOQ_PRICE[currentLeagueName][gamesOrWins][10] * ten + _bcHelper.DUOQ_PRICE[currentLeagueName][gamesOrWins][1] * one;
};

DuoBoostController.prototype._createDescription = function() {
    if (!this._currentLeague || !this._currentDivision || !this._desiredNumber || !this._numberSuffix) return '';

    return '{{currentLeagueName}} ({{currentDivisionName}}) - {{number}} {{suffix}}'.replace(
        '{{currentLeagueName}}',
        _bcHelper.LEAGUES[this._currentLeague].title
    ).replace(
        '{{currentDivisionName}}',
        _bcHelper.DIVISIONS[this._currentDivision].title
    ).replace(
        '{{number}}',
        this._desiredNumber
    ).replace(
        '{{suffix}}',
        _bcHelper.GAMES_OR_WINS[this._numberSuffix].title
    );
};

module.exports = DuoBoostController;