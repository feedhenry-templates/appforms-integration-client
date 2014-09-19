/**
 * Form View that extends the $fh.forms.backbone SDK.
 *
 * This view handles the process of rendering/validating/submitting forms to the remote server.
 *
 * Note: Although the $fh.forms.backbone SDK handles all of the process for submitting forms, you may want to add
 * additional functionality to the form to handle particular use-cases.
 *
 * This view is a standard Backbone view and can therefore be extended with any additional functions required
 * for customisation.
 * @type {*}
 */
App.View.FormSDK = $fh.forms.backbone.FormView.extend({

  /**
   * Function to register any submission events to the form view.
   */
  registerSubmissionEvents: function(){
    var self = this;

    //Listening to the submission "error" event
    self.submission.on("error", function(err){
      self.trigger("error", err);
    });

    //Listening to the submission "savedraft" event
    self.submission.on("savedraft", function(){
      var localId = self.submission.getLocalId();
      self.trigger("saveDraft", localId);
    });

    //Listening to the submission "validationerror" event
    self.submission.on("validationerror", function(err){
      self.trigger("validationerror", err);
    });

    //Listening to the submission "queued" event
    self.submission.on("queued", function(remoteSubmissionId){
      self.trigger("queued", remoteSubmissionId);
    });

    //Listening to the submission "progress" event
    self.submission.on("progress", function(progress){
      self.trigger("progress", progress);
    });

    //Listening to the submission "submitted" event
    self.submission.on("submitted", function(remoteSubmissionId){
      //Note: the triggered view event name does not have to be the same as the submission event name.
      var localId = self.submission.getLocalId();
      self.trigger("complete",localId, remoteSubmissionId);
    });
  },
  customFunction: function(){
    //<< Any  Additional Logic Needed For Dealing With A Form View>>
  }
});