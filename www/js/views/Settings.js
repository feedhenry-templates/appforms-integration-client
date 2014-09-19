/**
 * Settings View For A Forms App.
 *
 * This view renders the settings that apply to forms using the $fh.forms.config API
 * @type {*}
 */
App.View.Settings = Backbone.View.extend({
  el: "#jobList",
  events: {
    "change input[name='renderOptions']": "formsRenderChange", //Function to change which type of forms rendering is performed.
    "click button.saveConfig": "saveConfig", //Saving any updated config values to to local storgage.
    "click button.cancelConfig": "cancelConfig"
  },
  render: function(){
    var self = this;

    self.$el.empty();

    /**
     * A JSON object showing all of the settings available in forms.
     * @type {*}
     */
    var formsSettings = $fh.forms.config.getConfig();

    /**
     * The ID of the device that the App is running on.
     */
    var deviceId = $fh.forms.config.getDeviceId();

    /**
     * Editing form configuration is only allowed if the device Id is set in the studio Advanced Config for forms.
     * @type {Boolean}
     */
    var editAllowed = $fh.forms.config.editAllowed();
    formsSettings.editAllowed = editAllowed;
    formsSettings.device_id = deviceId;
    /**
     * Handlebars template to render forms config.
     * @type {*|jQuery}
     */
    var createTemplate = $('#formsConfig').html();

    var c_createTemplate = Handlebars.compile(createTemplate);

    self.$el.append(c_createTemplate(formsSettings));

    /**
     * Setting the default value for the render options ($fh.forms.backbone SDK Form View and Custom Form View).
     */
    self.$el.find("label.btn").removeClass("active");
    self.$el.find("input[name='renderOptions']").prop( "checked", false );
    self.$el.find("label." + App.renderChoice).addClass("active");
    self.$el.find("label." + App.renderChoice + " > input").prop( "checked", true );

    /**
     * If editing settings is not allowed, then the inputs should be disabled.
     */
    if(!editAllowed){
      self.$el.find(".formSettings").prop("disabled", true);
    }
  },
  /**
   * Changes the type of forms rendering from custom to backbone SDK.
   */
  formsRenderChange: function(e){
    var currentTarget = $(e.currentTarget);

    //Setting the current rendering choice.
    App.renderChoice = currentTarget.val();
  },
  saveConfig: function(){
    var self = this;
    App.views.alertView.show("Updating Config Values");

    //For each of the config inputs, update the config value.
    var configInputs = self.$el.find(".formSettings");

    _.each(configInputs, function(configInput){
      configInput = $(configInput);
      var configKey = configInput.data("setting");

      //Setting the config value to $fh.forms.config.
      $fh.forms.config.set(configKey, configInput.val());
    });

    //Saving the updated configuration
    $fh.forms.config.saveConfig(function(){
      App.views.alertView.hide();
      App.views.header.showNewJobList();
    });
  },
  cancelConfig: function(){
    App.views.header.showNewJobList();
  }
});