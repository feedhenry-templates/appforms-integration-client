/**
 * The User Model is a standard Backbone model.
 *
 * The url of this model is customised to be the cloud endpoint of the current app.
 * @type {Backbone Model}
 */
App.Model.User = Backbone.Model.extend({
  idAttribute: "userId", //The unique id field for job is jobId
  url: function(){
    var userId = this.id;

    /**
     * A simple login for a user
     *
     * <<mbaas-url>>/user/<<userId>>
     */
    return $fh.getCloudURL() + "/user/" + userId;
  }
});