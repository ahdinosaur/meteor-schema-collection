Package.describe({
  summary: "wraps Meteor.Collection to provide automatic validation using JSON-Schema"
});

Package.on_use(function (api) {
  var both = ['client', 'server'];
  api.use('underscore', both);
  api.use('JSV', both);
  api.add_files('common.js', both);
});
