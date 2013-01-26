
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
  _originalSearEntryPosition : null,
  // height of the top bar, required for animations
  _height: 25,

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

    this._height = Main.panel.actor.height;
    this._hidden = false;
    this._hideTime = 0;
    if (params.enabled) {
      this.enable();;
    }
  },//_init

  _pinIt: function(pin) {
    //from: http://ubuntuforums.org/showpost.php?p=11438228&postcount=15
    Main.layoutManager.removeChrome(Main.layoutManager.panelBox);
    Main.layoutManager.addChrome(Main.layoutManager.panelBox, { affectsStruts: pin });
  },

  _hidePanel: function() {

    if (Main.overview.visible || !this._panelHideable) {
      return;
    }

    Tweener.addTween(Main.panel.actor, {
      height: 1, time: this._animationTime, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._leftCorner.actor, {
      y: 0, time: this._animationTime, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._rightCorner.actor, {
      y: 0, time: this._animationTime, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._leftBox, {
      opacity: 0, time: this._animationTime-0.1, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._centerBox, {
      opacity: 0, time: this._animationTime-0.1, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._rightBox, {
      opacity: 0, time: this._animationTime-0.1, transition: 'easeOutQuad'
    });
    this._hidden = true;
  },//_hidePanel

  _showPanel: function() {

    if (!this._hidden) {
      return;
    }

    Tweener.addTween(Main.panel._leftCorner.actor, {
      y: this._height -1, time: this._animationTime+0.1, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._rightCorner.actor, {
      y: this._height -1, time: this._animationTime+0.1, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel.actor, {
      height: this._height, time: this._animationTime, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._leftBox, {
      opacity: 255,time: this._animationTime+0.2, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._centerBox, {
      opacity: 255, time: this._animationTime+0.2, transition: 'easeOutQuad'
    });
    Tweener.addTween(Main.panel._rightBox, {
      opacity: 255, time: this._animationTime+0.2, transition: 'easeOutQuad'
    });

    this._hidden = false;
    if (!this._overviewMoved && Main.overview.visible) {
      this._overviewMoved = true;
      let pos = Main.overview._searchEntry.get_position();
      this._originalSearEntryPosition = pos;
      Main.overview._searchEntry.set_position(pos[0], pos[1] + 27);
      //  Main.overview._relayout();
    }
  },//_showPanel

  _toggleHideable: function(actor, event) {

     let ticks = event.get_time();

     if (this._hideTime == 0) {
      this._hideTime = ticks;
      return;
     }

     if ( (ticks - this._hideTime) > this._timeDelta) {
      this._hideTime = 0;
      return;
     }

     if (this._panelHideable == true) {
       this._panelHideable = false;
       this._pinIt(true);
     } else {
       this._panelHideable = true;
       this._pinIt(false);
     }

     this._hideTime = 0;

  },//_toggleHideable

  _showDelayed: function() {
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
    this._hidePanel();
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

    this._mainPanelSignals.push(Main.panel.actor.connect('leave-event', Lang.bind(this, this._hideDelayed)));
    this._mainPanelSignals.push(Main.panel.actor.connect('enter-event', Lang.bind(this, this._showDelayed)));
    this._mainPanelSignals.push(Main.panel.actor.connect('button-release-event', Lang.bind(this, this._toggleHideable)));

    this._overviewSignals.push(Main.overview.connect('hidden',  Lang.bind(this, this._hidePanel)));
    this._overviewSignals.push(Main.overview.connect('shown',  Lang.bind(this, this._showPanel)));

    this._hidePanel();
  },

  disable: function() {

    this._panelHideable = false;
    this._pinIt(true);

    for (let i=0; i < this._mainPanelSignals.length; i++) {
      Main.panel.actor.disconnect(this._mainPanelSignals[i]);
    }
    this._mainPanelSignals = [];

    for (let i=0; i < this._overviewSignals.length; i++) {
      Main.overview.disconnect(this._overviewSignals[i]);
    }
    this._overviewSignals = [];
    this._showPanel();
  }
};

