/**
 * The Job Model is a standard Backbone model.
 *
 * The url of this model is customised to be the cloud endpoint of the current app.
 * @type {Backbone Model}
 */
App.Model.Job = Backbone.Model.extend({
  idAttribute: "jobId", //The unique id field for job is jobId
  url: function(){
    var jobId = this.id;

    /**
     * In the Integration Cloud App, we have set up a RESTful "/jobs" route the handle job data.
     *
     * <<mbaas-url>>/jobs/<<jobId>>
     */
    return $fh.getCloudURL() + "/jobs/" + jobId;
  }
});

/**
 * A standard backbone collection of Job models.
 *
 * The url of this collection is customised to be the cloud endpoint of the current app. This is for the same reason as the url for the model is customised.
 * @type {Backbone Collection}
 */
App.Collection.Jobs = Backbone.Collection.extend({
  model: App.Model.Job,
  url: function(){
    /**
     * In the Integration Cloud App, we have set up a RESTful "/jobs" route the handle job data.
     */
    return $fh.getCloudURL() + "/jobs"
  }
});

App.collections.jobs = new App.Collection.Jobs();