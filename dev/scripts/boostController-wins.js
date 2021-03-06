"use strict";

var FormTemplate = require('./formTemplate');
var TierImageController = require('./boostController-tierImage');
var OptionsVisibilityController = require('./boostController-optionsVisibility');
var ValueDisplay = require('./boostController-valueDisplay');
var ModalWindow = require('./modalWindow');
var _bcHelper = require('./boostController-helper');
var _ajax = require('./ajax');

function WinsBoostController(options) {
    FormTemplate.call(this, options);

    this._currentTierWeight = 0;

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
    this._onSubmit = this._onSubmit.bind(this);
    this._onClick = this._onClick.bind(this);

    this._addListener(this._elem, 'customselect', this._onCustomSelect);
    this._addListener(this._elem, 'custominputrangeslide', this._onCustomInputRange);
    this._addListener(this._elem, 'custominputrangechange', this._onCustomInputRange);
    this._addListener(this._elem, 'submit', this._onSubmit);
    this._addListener(this._elem, 'click', this._onClick);

    this._currentLeagueSelect.setOption({value: _bcHelper.LEAGUES.br.name});
    this._currentDivisionSelect.setOption({value: _bcHelper.DIVISIONS.d5.name});
    this._winsInputRange.setValue(10);
}

WinsBoostController.prototype = Object.create(FormTemplate.prototype);
WinsBoostController.prototype.constructor = WinsBoostController;

WinsBoostController.prototype.remove = function() {
    this._destroyImageControllers();
    this._destroyOptionsControllers();
    this._destroyValueDisplays();

    FormTemplate.prototype.remove.apply(this, arguments);
};

WinsBoostController.prototype._destroyImageControllers = function() {
    if (this._currentTierImageController) {
        this._currentTierImageController.remove();
    }
};

WinsBoostController.prototype._destroyValueDisplays = function() {
    if (this._winsDisplay) {
        this._winsDisplay.remove();
    }

    if (this._descriptionDisplay) {
        this._descriptionDisplay.remove();
    }

    if (this._priceDisplay) {
        this._priceDisplay.remove();
    }
};

WinsBoostController.prototype._destroyOptionsControllers = function() {
    if (this._currentLeagueOptionsController) {
        this._currentLeagueOptionsController.remove();
    }

    if (this._currentDivisionOptionsController) {
        this._currentDivisionOptionsController.remove();
    }
};

WinsBoostController.prototype._onClick = function(e) {
    var target = e.target;

    if (target.matches('.img_submit')) {
        this._onSubmit();
    }
};

WinsBoostController.prototype._getCustomInputs = function() {
    var customInput;

    for (var i = 0; i < this._customSelectArr.length; i++) {
        customInput = this._customSelectArr[i].getElem();

        if (customInput.matches('#wins-current-league-select')) {
            // console.log('_currentLeagueSelect found!');
            this._currentLeagueSelect = this._customSelectArr[i];

        } else if (customInput.matches('#wins-current-division-select')) {
            // console.log('_currentDivisionSelect found!');
            this._currentDivisionSelect = this._customSelectArr[i];

        }
    }

    for (i = 0; i < this._customInputRangeArr.length; i++) {
        customInput = this._customInputRangeArr[i].getElem();

        if (customInput.matches('#wins-number-range')) {
            // console.log('_currentLeagueSelect found!');
            this._winsInputRange = this._customInputRangeArr[i];

        }
    }
};

WinsBoostController.prototype._setTier = function(prefix, leagueName, divisionName) {
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

WinsBoostController.prototype._setTierAndCheck = function(prefix, leagueName, divisionName) {
    if (!prefix || prefix !== 'current') return;

    if (this._setTier(prefix, leagueName, divisionName)) {
        this._checkOptions();
    }
};

WinsBoostController.prototype._checkOptions = function() {
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

WinsBoostController.prototype._onCustomSelect = function(e) {
    var target = e.target;
    var value = e.detail.value;

    if (target === this._currentLeagueSelect.getElem()) {
        this._setTierAndCheck('current', value, this._currentDivision);

    } else if (target === this._currentDivisionSelect.getElem()) {
        this._setTierAndCheck('current', this._currentLeague, value);

    }

    this._displayCalculatedValues();
};

WinsBoostController.prototype._onCustomInputRange = function(e) {
    var target = e.target;
    var value = e.detail.value;

    if (target === this._winsInputRange.getElem()) {
        this._setWins(value);

    }

    this._displayCalculatedValues();
};

WinsBoostController.prototype._setWins = function(value) {
    this._desiredWins = value;
    this._winsDisplay.showValue(this._desiredWins);
};

WinsBoostController.prototype._createImageControllers = function() {
    var currentTierImage = this._elem.querySelector('#wins-current-tier');
    this._currentTierImageController = new TierImageController({
        imageElem: currentTierImage
    });
};

WinsBoostController.prototype._createValueDisplays = function() {
    var winsDisplay = this._elem.querySelector('#wins-display');
    this._winsDisplay = new ValueDisplay({
        displayElem: winsDisplay
    });

    var descriptionDisplay = this._elem.querySelector('.display_description');
    this._descriptionDisplay = new ValueDisplay({
        displayElem: descriptionDisplay,
        prefix: 'Wins Boost: '
    });

    var priceDisplay = this._elem.querySelector('.display_price');
    this._priceDisplay = new ValueDisplay({
        displayElem: priceDisplay,
        prefix: 'Total Cost: <strong>',
        suffix: '&euro;</strong>'
    });
};


WinsBoostController.prototype._createOptionsVisibilityControllers = function() {
    this._currentLeagueOptionsController = new OptionsVisibilityController({
        selectElem: this._currentLeagueSelect.getElem(),
        optionsGroup: 'LEAGUES'
    });

    this._currentDivisionOptionsController = new OptionsVisibilityController({
        selectElem: this._currentDivisionSelect.getElem(),
        optionsGroup: 'DIVISIONS'
    });
};

WinsBoostController.prototype._displayCalculatedValues = function() {
    this._descriptionDisplay.showValue(this._createDescription());
    this._priceDisplay.showValue(Math.floor(this._getTotalPrice()));
};

WinsBoostController.prototype._getTotalPrice = function() {
    if (!this._currentLeague || !this._desiredWins) {
        return 0;
    }

    return this._totalPriceSoloQBoost(this._currentLeague, _bcHelper.GAMES_OR_WINS.wns.name, this._desiredWins);
};

WinsBoostController.prototype._totalPriceSoloQBoost = function (currentLeagueName, gamesOrWins, desiredNumber) {
    // console.log(currentLeagueName + ' ' + gamesOrWins + ' ' + desiredNumber);
    var one = desiredNumber % 10;
    var ten = (desiredNumber - one) / 10;

    return _bcHelper.SOLOQ_PRICE[currentLeagueName][gamesOrWins][10] * ten + _bcHelper.SOLOQ_PRICE[currentLeagueName][gamesOrWins][1] * one;
};

WinsBoostController.prototype._createDescription = function() {
    if (!this._currentLeague || !this._currentDivision || !this._desiredWins) return '';

    return '{{currentLeagueName}} ({{currentDivisionName}}) - {{number}} {{suffix}}'.replace(
        '{{currentLeagueName}}',
        _bcHelper.LEAGUES[this._currentLeague].title
    ).replace(
        '{{currentDivisionName}}',
        _bcHelper.DIVISIONS[this._currentDivision].title
    ).replace(
        '{{number}}',
        this._desiredWins
    ).replace(
        '{{suffix}}',
        _bcHelper.GAMES_OR_WINS.wns.title
    );
};

WinsBoostController.prototype._onSubmit = function(e) {
    if (e) {
        e.preventDefault();
    }

    if (this._waitingForResponse) {
        // console.log('Already sent form!');
        return;
    }

    var reqBody = this._getReqBody();

    if (!reqBody) return;

//    this._waitingForResponse = true;
//    this._elem.classList.add('waiting_for_response');

    var formData = this._createFormData(reqBody);

    _ajax.ajax("POST", "php/paypal_createPayment.php", this._onReqEnd.bind(this), formData);

    var str = '<div class="instruction_container">' +
        '<div>You\'ve sent a request for <b>' + this._createDescription() + '</b>, for accepting follow the instructions below:</div>' +
        '<ul class="instruction_list">' +
        '<li><span>Authorize to your PayPal account.</span></li>' +
        '<li><span>Choose <b>Send payments for goods or services</b>.</span></li>' +
        '<li><span>Type or Copy our Mail address <b>violetta007@yandex.ru</b> and press <b>NEXT</b>.</span></li>' +
        '<li><span>The service is cost by <b>' + Math.floor(this._getTotalPrice()) + ' &euro;</b>, Type or Copy this amount in the box <b>"Recipient receives"</b> and chose the <b>currency&nbsp;- EUR</b>*</span></li>' +
        '<li><span>Press <b>Continue</b> and <b>Confirm</b> the payment</span>.</li>' +
        '<li><span>Done, we will back to you shortly on e-mail to find out the details**</span>.</li>' +
        '</ul>' +
        '<div>*You can add Notes if you want, but its not nessesary unless the e-mail on the paypal is the same as in order on our website.</div>' +
        '<div>**If you have  some issues or questions, do not hesitate to write us on our <b>Online Chat</b>.</div>' +
        '<div>';

    var instruction = new ModalWindow({
        modalClass: 'insructions_notification',
        modalInnerHTML: str,
        buttons: {
            close: '<span></span><span></span>'
        }
    });
};

WinsBoostController.prototype._getReqBody = function() {
    var valuesObj = this._getUserInputValues();

    if (!valuesObj || valuesObj.__validationFailed) return false;

    return {
        serviceType: 'winsBoost',
        currentLeague: this._currentLeague,
        currentDivision: this._currentDivision,
        desiredNumber: this._desiredWins,
        name: valuesObj.Name,
        email: valuesObj.Email
    };
};

WinsBoostController.prototype._onReqEnd = function(xhr) {
    if (!this._elem) return;

    this._waitingForResponse = false;
    this._elem.classList.remove('waiting_for_response');

    var res;

    try {
        res = JSON.parse(xhr.responseText);
    } catch(e) {
        res = false;
    }

    if (xhr.status === 200 && res.success) {
        // this._elem.innerHTML = this._succsessNotificationHTML;
        // console.log(res);
        // console.log(res.approval_link);

        /*window.location = res.approval_link;*/
    } else {
        this._showErrorNotification();
        // console.log(res);
    }
};

module.exports = WinsBoostController;
