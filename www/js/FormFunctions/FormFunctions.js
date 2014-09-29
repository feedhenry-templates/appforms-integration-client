/**
 * These helper functions allow for multiple views to load forms and submissions.
 */
App.FormFunctions = {
  /**
   * Function to load the form to be rendered.
   */
  loadForm: function(params, cb){
    /**
     * No "formId" parameter is passed, this can occur when downloading a submission that contains a form that does not exist on
     * the client. In this case the form is instantiated from the submission.
     */
    if(!params.formId){
      return cb();
    }

    //Loading the form from remote if not using rawMode
    if(!params.rawMode){
      params.fromRemote = true;
    }

    /**
     * Using the $fh.forms.getForm API function to load the form  definition from remote.
     * If the form has not been updated, then it is loaded from local memory.
     *
     * params: {
     *  formId: <<ID of the form to load>>
     *  fromRemote: <<true/false>> Load the form from the cloud.
     *  rawMode: <<true/false>> Load the form from a JSON object (rawData)
     *  rawData: <<JSON Object>> representing the full definition of a form.
     * }
     *
     */
    $fh.forms.getForm(params, function(err, form){
      if(err){
        return cb(err);
      } else {
        return cb(null, form);
      }
    });
  },
  /**
   * Loading a submission for the form.
   *
   * If a submission id is already available, then that submission is loaded from local memory along with the form it
   * relates to.
   *
   * If the submission does not already exist on the Client, it can be downloaded for viewing.
   * Note: Downloaded submissions cannot be edited on the Client.
   */
  loadSubmission: function(params, cb){
    var self = this;
    var localSubmissionId = params.submissionId;
    var remoteSubmissionId = params.remoteSubmissionId;
    var form = params.form;

    /**
     * If there is a local Submission ID associated with this form view, then load the submission from local memory.
     */
    if(localSubmissionId){
      self.loadLocalSubmission(localSubmissionId, cb);
    } else if (remoteSubmissionId){
      /**
       *The job has a remoteSubmissionId, therefore the submission has to be downloaded.
       */
      self.downloadSubmission(remoteSubmissionId, cb);
    } else {

      /**
       * No submission is associated with the submission, create a new one if there is a form associated with
       * the Form View
       */

      //New submission model passed back if one does not exist already.
      if(form){
        //Calling newSubmission from the form model automatically associates the submission to the form.

        var submission = form.newSubmission();

        //Pre-filling values for a submission
        //Here it is possible to add field data to a submission before it is rendered to the user.
        //This is useful when it is necessary to add external data to a form.
        submission = self.addSubmissionData(form, submission, function(err){
          return cb(err, {submission: submission});
        });
      } else {
        //No form or submission associated with the Form View.
        return cb("No form or submission associated with the Form View.");
      }
    }
  },
  /**
   * Loading a submission that is located on the Client App in Local Memory.
   *
   *
   * @param localSubmissionId - The Local Id of the submission located on the Client.
   * @param cb - Function to execute when the submission has been found / error
   */
  loadLocalSubmission: function(localSubmissionId, cb){
    var self = this;
    //Loading the submission object containing a list of the submissions available on the Client
    $fh.forms.getSubmissions({}, function(err, submissions){
      if(err){
        return cb(err);
      }

      var submissionsArray = submissions.getSubmissions();

      /**
       * Checking if the "local" submission ID (_ludid) or the remote submission ID (_id) matches the submission ID
       * passed to the function.
       */
      var matchingSubmissions = _.filter(submissionsArray, function(submissionInformation){
        return submissionInformation["_id"] === localSubmissionId || submissionInformation["_ludid"] === localSubmissionId;
      });

      /**
       * No match. Therefore the submission cannot be loaded.
       */
      if(matchingSubmissions.length === 0){
        return cb("No submission matching id " + localSubmissionId);
      }

      /**
       * Now there is a valid submission, we can now load the submission model
       */
      submissions.getSubmissionByMeta(matchingSubmissions[0], function(err, submission){
        if(err){
          return cb(err);
        }


        //Loaded the submission model, now load the form associated with it.
        submission.getForm(function(err, form){
          if(err){
            return cb(err);
          }

          return cb(null, {form: form, submission: submission});
        });
      });
    });
  },
  /**
   * Downloading a submission that may not be located in the Client Local Memory.
   *
   * In this case, the form definition is stored as part of the submission object and must be instantiated from that
   * definition.
   *
   * @param remoteSubmissionId - The Remote Id of a submission to be downloaded from the Cloud App.
   * @param cb - Function to execute when the submission has been downloaded / error
   */
  downloadSubmission: function(remoteSubmissionId, cb){
    var self = this;

    //Downloading the submission.
    //If the submission has already been downloaded to Local Memory, it will be loaded from there instead of downloading
    //from the clood.
    $fh.forms.downloadSubmission({submissionId: remoteSubmissionId}, function(err, downloadedSubmission){
      if(err){
        return cb(err);
      }

      //Having found the submission, the submission needs to be rendered with a form.
      //The form that the submission was a submitted against, is sent back with the submission from the server.
      var formSubmittedAgainst = downloadedSubmission.getFormSubmittedAgainst();
      var formId = downloadedSubmission.getFormId();

      //Getting a form model to render the submission against.
      //rawMode: the form model does not use an internet request to get the definition of the form.
      //rawData: a JSON object representing the full definition of the form
      self.loadForm({rawMode: true, rawData: formSubmittedAgainst, formId: formId}, function(err, form){
        if(err){
          return cb(err);
        }

        return cb(null, {form: form, submission: downloadedSubmission});
      });
    });
  },
  /**
   * Adding existing data to a submission.
   *
   * In this case, the "userId" and "userName" is pre-populated to the submission before rendering.
   *
   * We are using the field codes functionality in the studio to assign the "userId" and "userName" field codes to
   * text fields.
   * @param form - The form model containing fields with field codes: "userId" and "userName"
   * @param submission - The submission model to add fields to.
   */
  addSubmissionData: function(form, submission, cb){
    //Getting the relevant data from the "User" logged into the app.
    var userId = App.views.login.user.get("userId");
    var userName = App.views.login.user.get("userName");

    var userIdField = form.getFieldModelByCode("userId");
    var userNameField = form.getFieldModelByCode("userName");

    async.series([
      function(cb){
        if(userIdField && userId){
          var userFieldId = userIdField.getFieldId();

          submission.addInputValue({
            fieldId: userFieldId,
            value: userId,
            index: 0
          }, cb);
        } else {
          cb();
        }
      },
      function(cb){
        if(userNameField && userName){
          var userNameFieldId = userNameField.getFieldId();

          submission.addInputValue({
            fieldId: userNameFieldId,
            value: userName,
            index: 0
          }, cb);
        } else {
          cb();
        }
      }
    ], cb);
  }
}