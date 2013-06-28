
Ext.define('DirectoryListing.controller.GUI', {
    extend: 'Ext.app.Controller',

    views: [ 'Viewport' ],
    stores: [  ],

    refs: [
        { ref: 'viewport', selector: 'viewport' },
        { ref: 'window', selector: 'window[xid=filewindow]' },
        { ref: 'toolbar', selector: 'window[xid=filewindow] toolbar[dock=top]' },
        { ref: 'dirtree', selector: 'window[xid=filewindow] treepanel[xid=dirtree]' },
        { ref: 'filelist', selector: 'window[xid=filewindow] gridpanel[xid=filelist]' },
        { ref: 'currentpath', selector: 'window[xid=filewindow] panel textfield[xid=current-path]' },
        { ref: 'openbutton', selector: 'window[xid=filewindow] toolbar button[xid=file-open]' },
        { ref: 'directlinkbutton', selector: 'window[xid=filewindow] toolbar button[xid=direct-link]' }
    ],

   showHiddenFiles:false,
   expandPathArray: [],
   expandPathIndex: 0,
   expandPathString:'',

   windowState: 'restored',

   init: function() {

        this.control({
            'window[xid=filewindow]': {
               afterrender: this.onBodyRendered,
               maximize: this.onWindowMaximized,
               restore: this.onWindowRestored
            },
            'window[xid=filewindow] toolbar button': {
               click: this.onButtonClicked
            },
            'window[xid=filewindow] toolbar button[xid=hidden-files]': {
               toggle: this.onShowHiddenFilesToggled
            },
            'window[xid=filewindow] treepanel[xid=dirtree]': {
               selectionchange: this.onTreeDirSelected,
               load:this.onDirTreeLoad
            },
            'window[xid=filewindow] gridpanel[xid=filelist]': {
               itemclick: this.onFilelistSelected,
               itemdblclick: this.onOpenFile
            },
            'viewport': {
               afterrender: this.onViewportRendered/*,
               resize: this.onViewportResized*/
            },
            scope:this
        });

        this.application.on({
           'loggedin': this.globalLoggedin,
           'loggedout': this.globalLoggedout,
           'togglefilewindow': this.globalToggleFileWindow,
           'reloadfiletree': this.onReloadTree,
           scope: this
        });

   },

   globalLoggedin: function(user) {
      var tb = this.getToolbar();
      var il = tb.child('label[xid=logininfo]');
      var lb = tb.child('button[xid=login]');
      var m = tb.child('button[xid=manage]');
      il.setText("Logged in as "+user.username);
      il.show();
      lb.setText('Logout');

      if(Settings.user && Settings.user.admin && Settings.user.admin==true) {
         m.setDisabled(false);
         m.show();
      }
   },

   globalLoggedout: function() {
      var tb = this.getToolbar();
      var il = tb.child('label[xid=logininfo]');
      var lb = tb.child('button[xid=login]');
      var m = tb.child('button[xid=manage]');
      il.setText("Not logged in");
      il.hide();
      lb.setText('Login');
      m.setDisabled(true);
      m.hide();
   },

   globalToggleFileWindow: function(b) {
      if(b) {
         this.getWindow().show();
      } else {
         this.getWindow().hide();
      }
   },

   expandPath: function(me, treenode) {
      if(typeof me.expandPathArray[me.expandPathIndex]!="undefined") {
         if(me.expandPathString=='') me.expandPathString=separator;
         me.expandPathString += me.expandPathArray[me.expandPathIndex]+separator;
         me.expandPathIndex++;

         treenode.findChild('id', me.expandPathString).expand(false, function() {
            me.getDirtree().getSelectionModel().select(this);
            me.expandPath(me, this);
         });

      }
   },

   onBodyRendered: function() {
      var me = this;
      var body = me.getViewport();

      me.getWindow().on('resize', me.onViewportResized, me);

      if(typeof HashManager.get('path')!="string") {
         HashManager.set('path', '/');
      }

   },

   onDirTreeLoad: function(store, node, records) {
      var me = this;

      if(node.data.id=="root") {
         me.expandPathArray = HashManager.get('path').split(separator);
         me.expandPathIndex = 0;
         me.expandPathString = separator;
         me.expandPathArray.shift();
         me.expandPathArray.pop();

         if(me.expandPathArray.length>0 && node.findChild('id', separator+me.expandPathArray[0]+separator)!=null) {
            me.expandPath(me, node);
         } else {
            me.getDirtree().getSelectionModel().select(node.getChildAt(0));
         }

      }
   },

   onWindowMaximized: function() {
      this.windowState = "maximized";
   },

   onWindowRestored: function() {
      this.windowState = "restored";
   },

   onViewportResized: function() {
      var me = this;

      var body = me.getViewport();
      var bwidth = body.getWidth();
      var bheight = body.getHeight();
      var win = me.getWindow();
      var wwidth = Settings.windowwidth;
      var wheight = Settings.windowheight;

      if(me.windowState=="restored" && (wwidth>bwidth || wheight>bheight)) {
         win.setPosition(0,0);
         win.maximize();
      } else if(me.windowState=="maximized" && wwidth<=bwidth && wheight<=bheight) {
         win.restore();
      }

      if(me.windowState=="restored") {
         win.center();
      }

   },

   onViewportRendered: function() {

   },

   onButtonClicked: function(btn) {

      var dirtree = btn.up('window').child('treepanel[xid=dirtree]');

      // Tree
      if(btn.xid=='expandall') {
         if(dirtree.getRootNode().getChildAt(0) && dirtree.getRootNode().getChildAt(0).isExpanded()) {
            dirtree.collapseAll(function() {
               dirtree.expandAll();
            });
         } else {
            dirtree.expandAll();
         }
      }
      if(btn.xid=="collapseall") {
         dirtree.collapseAll();
      }
      if(btn.xid=="tree-reload") {
         this.onReloadTree();
      }

      // Grid
      if(btn.xid=='about') {
         Ext.require('DirectoryListing.view.AboutWindow', function() {
            Ext.create('DirectoryListing.view.AboutWindow').show();
         });
      }
      var record = btn.up('window').child('gridpanel[xid=filelist]').getSelectionModel().getSelection()[0];
      if(btn.xid=='file-open') {
         this.onOpenFile(null, record);
      }
      if(btn.xid=='direct-link') {
         this.onGetDirectLink(record);
      }
      if(btn.xid=='list-reload') {
         this.onReloadFilelist(record);
      }
      if(btn.xid=='login') {
         this.onBtnLoginClicked(btn);
      }
      if(btn.xid=='manage') {
         this.application.fireEvent('openmanagewindow');
         this.application.fireEvent('togglefilewindow', false);
      }
   },

   onShowHiddenFilesToggled: function(btn, pressed) {
      this.showHiddenFiles = pressed;
      this.onReloadFilelist();
   },

   onBtnLoginClicked: function(btn) {
      if(btn.getText()=="Login") {
         Ext.require('DirectoryListing.view.LoginWindow', function() {
            var loginwin = Ext.create('DirectoryListing.view.LoginWindow');
            loginwin.show();
         });
      } else {
         Ext.MessageBox.confirm('Logout', 'Are you sure you want to do that?', function(res) {
            if(res=="yes") {
               this.application.fireEvent('logout');
            }
         }, this);
      }
   },

   currentpath: null,

   onTreeDirSelected: function(tree, item) {
      var me = this;
      if(item.length<1 || !item[0].data) {
         return;
      }
      me.currentpath = item[0].data.id;

      this.getFilelist().setLoading(true);
      this.getFilelist().getStore().load({
         params: {
            'args[node]':me.currentpath,
            'args[showhidden]': me.showHiddenFiles
         },
         callback: function() {
            me.getFilelist().setLoading(false);
         }
      });

      item[0].expand();
      this.getOpenbutton().disable();
      this.getDirectlinkbutton().disable();
      this.getCurrentpath().setValue((me.currentpath=="root" ? "/" : me.currentpath));
      if(me.currentpath!="root") {
         HashManager.set('path', me.currentpath);
      }

   },

   onFilelistSelected: function(grid, item) {
      this.getOpenbutton().enable();
      this.getDirectlinkbutton().enable();
   },

   onOpenFile: function(grid, item) {
      this.getOpenbutton().enable();
      window.open(item.data.metadata.url);
   },

   onGetDirectLink: function(record) {
      Ext.require('DirectoryListing.view.UrlWindow', function() {
         var win = Ext.create('DirectoryListing.view.UrlWindow');
         win.setURL(record.raw.metadata.fqdnurl);
         win.show();
      });
   },

   onReloadTree: function() {
      this.getDirtree().getStore().load();
   },

   onReloadFilelist: function() {
      var me = this;
      this.getFilelist().setLoading(true);
      this.getFilelist().getStore().load({
         params: {
            'args[node]':me.currentpath,
            'args[showhidden]': me.showHiddenFiles
         },
         callback: function() {
            me.getFilelist().setLoading(false);
         }
      });
   }


});
