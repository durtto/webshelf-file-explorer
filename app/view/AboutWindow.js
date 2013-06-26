
Ext.define('DirectoryListing.view.AboutWindow', {
   extend: 'Ext.window.Window',
   layout:'fit',

   title:'About',
   width:400,

   items: [{
         xtype:'panel',
         bodyPadding:10,
         items: [
            {
               xtype:'container',
               html:(Config.about && Config.about.length>0 ? Config.about+"<br>&nbsp;<br><hr>&nbsp;<br>" : "")
            },
            {
               xtype:'container',
               html:
                  '<b><u>Credits</u></b><br>'+
                  'webshelf by Christian Blechert (<a href="http://fiae.ws" target="_blank">http://fiae.ws</a>)<br>'+
                  'Icons by <a href="http://www.famfamfam.com/lab/icons/" target="_blank">famfamfam</a><br>'+
                  'UI by <a href="http://www.sencha.com/products/extjs/" target="_blank">ExtJS</a>'
            }
         ]
   }]

});
