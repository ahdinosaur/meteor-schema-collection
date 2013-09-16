Meteor.SchemaCollection = function (name, options) {
  var self = this;

  if (!(self instanceof Meteor.SchemaCollection)) {
    throw new Error('use "new" to construct a Meteor.SchemaCollection');
  }

  options = options || {};

  if (!("schema" in options)) {
    throw new Error('Meteor.SchemaCollection options must define a schema');
  }
  self._schema = options.schema;
  
  // create the collection
  // TODO add support for SmartCollection
  self._name = name;
  self._collection = new Meteor.Collection(name, options);

  self._JSV = JSV;
  self._env = JSV.createEnvironment(options.env);

  // TODO
  // validate from the real collection,
  // prevents SC._collection.insert(invalidDoc) (and update) on client
};


// define validate fn
Meteor.SchemaCollection.prototype.validate = function (json) {
  var self = this;
  return self._env.validate(json, self._schema);
};

Meteor.SchemaCollection.prototype._insertOrUpdate = function (type, args) {
  var self = this,
      collection = self._collection,
      json, callback, error, options;

  if (!args.length) {
    throw new Error(type + " requires an argument");
  }

  if (type === "insert") {
    json = args[0];
    options = args[1];
  } else if (type === "update") {
    json = args[1];
    options = args[2];
  } else {
    throw new Error("invalid type argument");
  }

  // TODO allow env option

  // remove the options from insert now that we're done with them
  if (type === "insert" && args[1] !== void 0 && !(args[1] instanceof Function)) {
    args.splice(1, 1);
  }

  // figure out callback situation
  if (args.length && args[args.length - 1] instanceof Function) {
    callback = args[args.length - 1];
  }
  if (Meteor.isClient && !callback) {
    // Client can't block, so it can't report errors by exception,
    // only by callback. If they forget the callback, give them a
    // default one that logs the error, so they aren't totally
    // baffled if their writes don't work because their database is
    // down.
    callback = function(err) {
        if (err)
            Meteor._debug(type + " failed: " + (err.reason || err.stack));
    };
  }

  report = self.validate(json);

  if (report.errors.length === 0) {
    if (type === "insert") {
      return collection.insert.apply(collection, args);
    } else {
      return collection.update.apply(collection, args);
    }
  } else {
    error = new Error("failed validation");
    error.errors = report.errors;
    if (callback) {
      return callback(error);
    }
    throw error;
  }
};

Meteor.SchemaCollection.prototype.insert = function (/* arguments */) {
  var args = _.toArray(arguments);
  return this._insertOrUpdate("insert", args);
}

Meteor.SchemaCollection.prototype.update = function (/* arguments */) {
  var args = _.toArray(arguments);
  return this._insertOrUpdate("update", args);
};

Meteor.SchemaCollection.prototype.remove = function(/* arguments */) {
    var self = this, collection = self._collection;
    return collection.remove.apply(collection, arguments);
};

Meteor.SchemaCollection.prototype.allow = function(/* arguments */) {
    var self = this, collection = self._collection;
    return collection.allow.apply(collection, arguments);
};

Meteor.SchemaCollection.prototype.deny = function(/* arguments */) {
    var self = this, collection = self._collection;
    return collection.deny.apply(collection, arguments);
};

Meteor.SchemaCollection.prototype.find = function(/* arguments */) {
    var self = this, collection = self._collection;
    return collection.find.apply(collection, arguments);
};

Meteor.SchemaCollection.prototype.findOne = function(/* arguments */) {
    var self = this, collection = self._collection;
    return collection.findOne.apply(collection, arguments);
};
