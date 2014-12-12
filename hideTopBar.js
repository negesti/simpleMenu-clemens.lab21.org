/*jshint indent: 2*/
/*jshint camelcase: true*/
/*jshint immed: true*/
/*jshint curly: true*/

const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = new Me.imports.utils.Utils();


//  Auto hide top bar based on autohidetopbar2@werewolves.us
function HideTopBar(params) {
  this._init(params);
}

HideTopBar.prototype = {
  // the position searchEntry inside the overview can changed
  _overviewMoved: false,
  _originalSearchEntryPosition : null,
  // height of the top bar, required for animations
  _panelHeight: 25,

  // remember all singals connected to overview and main.panel
  _overviewSignals: [],
  _mainPanelSignals: [],

  // config options, initially set by params, may be changed from settings changes (extension.js handels this)
  _timeDelta: 1000,
  _showDelay: 300,
  _animationTime: 0.4,

  _init: function(params) {
    if (params.timeDelta) {
      this.setTimeDelta(params.timeDelta);
    }
    if (params.showDelay) {
      this.setShowDelay(params.showDelay);
    }
    if (params.animationTime) {
      this.setAnimationTime(params.animationTime);
    }

    this._panelActor = Main.panel.actor;
    this._panelBox = this._panelActor.get_parent();
    this._panelHeight = this._panelActor.height;
    this._hidden = false;
    this._hideTime = 0;
    if (params.enabled) {
      this.enable();
    }
  },//_init

  _pinIt: function(pin) {
    //from: http://ubuntuforums.org/showpost.php?p=11438228&postcount=15
    Main.layoutManager.removeChrome(Main.layoutManager.panelBox);
    Main.layoutManager.addChrome(Main.layoutManager.panelBox, { affectsStruts: pin });
  },

  // "Inspired" by "hidetopbar@mathieu.bidon.ca
  _hidePanel: function() {

    if (Main.overview.visible || !this._panelHideable) {
      return;
    }
    this._panelBox.height = 1;

    Tweener.addTween(this._panelActor, {
        y:  1 - this._panelHeight,
        time: this._animationTime,
        transition: 'easeOutQuad',
        onComplete: Lang.bind(this, function() {
            Main.panel._centerBox.hide();
            Main.panel._rightBox.hide();

            let els = Main.panel._leftBox.get_children();
            for each(let el in els.slice(1)) {
                if(typeof(el._cotainer) == "undefined") el.hide();
                else el._container.hide();
            }

            this._panelActor.set_opacity(0);
            this._hidden = true;
        })
    });
  },//_hidePanel

  // "Inspired" by "hidetopbar@mathieu.bidon.ca
  _showPanel: function() {
    if (!this._hidden) {
      return;
    }

    this._panelBox.height = this._panelHeight;
    this._panelActor.set_opacity(255);
    Main.panel._centerBox.show();
    Main.panel._rightBox.show();

    let els = Main.panel._leftBox.get_children();
    let el;
    for each(el in els.slice(1)) {
        if(typeof(el._cotainer) == "undefined") el.show();
        else el._container.show();
    }

    Tweener.addTween(this._panelActor, {
        y: 0,
        time: this._animationTime,
        transition: 'easeOutQuad',
    });
    this._hidden = false;

  },//_showPanel

  _toggleHideable: function(actor, event) {

     let ticks = event.get_time();

     if (this._hideTime === 0) {
      this._hideTime = ticks;
      return;
     }

     if ( (ticks - this._hideTime) > this._timeDelta) {
      this._hideTime = 0;
      return;
     }

     if (this._panelHideable === true) {
       this._panelHideable = false;
       this._pinIt(true);
     } else {
       this._panelHideable = true;
       this._pinIt(false);
     }

     this._hideTime = 0;

  },//_toggleHideable

  _showDelayed: function() {

    if (Utils.getBoolean(Utils.DISABLE_MOUSEOVER_SHOW, false)) {
      return;
    }

    this._mouseInside = true;
    Mainloop.timeout_add(this._showDelay,
      Lang.bind(this,
        function() {
          if (this._mouseInside) {
            this._showPanel();
          }
        }
      )
    );
  },

  _hideDelayed: function() {
    this._mouseInside = false;
    Mainloop.timeout_add(this._showDelay,
      Lang.bind(this,
        function() {
          if (!this._mouseInside) {
            this._hidePanel();
          }
        }
      )
    );
  },

  // Called by extension.js on settings::changed signal
  setTimeDelta: function(timeDelta) {
    this._timeDelta = (timeDelta * 1000);
  },

  setShowDelay: function(showDelay) {
    this._showDelay = (showDelay * 100);
  },

  setAnimationTime: function(animationTime) {
    if (animationTime > 1) {
      this._animationTime = (animationTime / 10);
    }
  },

  enable: function() {
    this._panelHideable = true;
    this._pinIt(false);

    this._mainPanelSignals = [];
    this._overviewSignals = [];

    this._mainPanelSignals.push(Main.panel.actor.connect('leave-event', Lang.bind(this, this._hideDelayed)));
    this._mainPanelSignals.push(Main.panel.actor.connect('enter-event', Lang.bind(this, this._showDelayed)));
    this._mainPanelSignals.push(Main.panel.actor.connect('button-release-event', Lang.bind(this, this._toggleHideable)));

    this._overviewSignals.push(Main.overview.connect('hidden',  Lang.bind(this, this._hidePanel)));
    this._overviewSignals.push(Main.overview.connect('shown',  Lang.bind(this, this._showPanel)));

    this._hidePanel();
  },

  disable: function() {
    this._showPanel();
    this._panelHideable = false;
    this._pinIt(true);

    if (this._originalSearchEntryPosition !== null) {
      Main.overview._searchEntry.set_position(this._originalSearchEntryPosition[0], this._originalSearchEntryPosition[1]);
    }


    for (let i=0; i < this._mainPanelSignals.length; i++) {
      try {
        Main.panel.actor.disconnect(this._mainPanelSignals[i]);
      } catch (e) {
        global.log("Error disconnecting signal from Main.panel.actor");
      }
    }
    this._mainPanelSignals = [];

    for (let i=0; i < this._overviewSignals.length; i++) {
      try {
        Main.overview.disconnect(this._overviewSignals[i]);
      } catch (e) {
        global.log("Error disconnecting signal from Main.overview");
      }
    }
    this._overviewSignals = [];
  }
};

