const TuyaDevice = require("tuyapi");

var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    "homebridge-goldair-fan",
    "goldairHeater",
    FanAccessory
  );
};

function FanAccessory(log, config) {
  this.log = log;
  this.name = config["name"];

  this.service = new Service.Fanv2(this.name);

  try {
    // Construct a new device and resolve the IP
    this.tuyaDevice = new TuyaDevice({
      id: config["id"],
      key: config["key"],
      persistentConnection: true
    });

    this.tuyaDevice
      .find()
      .then(() => this.tuyaDevice.connect())
      .then(connected => {
        this.log("Connected: %s", connected);
        return this.tuyaDevice.get({ schema: true });
      })
      .then(schema =>
        this.log("Schema for this device:\n%s", JSON.stringify(schema, null, 2))
      );
  } catch (error) {
    this.log.error(
      "%s was unable to be found. Please try using a static IP in your config.json.",
      device.id
    );
  }

  this.service
    .getCharacteristic(Characteristic.Active)
    .on("get", this.getActive.bind(this))
    .on("set", this.setActive.bind(this));

  this.service
    .getCharacteristic(Characteristic.RotationSpeed)
    .on("get", this.getTemperature.bind(this))
    .on("set", this.setTemperature.bind(this));

  this.service
    .getCharacteristic(Characteristic.SwingMode)
    .on("get", this.getSwingMode.bind(this))
    .on("set", this.setSwingMode.bind(this));

  this.service
    .getCharacteristic(Characteristic.LockPhysicalControls)
    .on("get", this.getLockPhysicalControls.bind(this))
    .on("set", this.setLockPhysicalControls.bind(this));
}

FanAccessory.prototype.getActive = function(callback) {
  this.log("Getting current active state...");

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .get({ dps: 1 })
      .then(status => {
        this.log("Returned current active state as " + status);
        callback(
          null,
          status ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE
        );
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.setActive = function(state, callback) {
  if (this.service.getCharacteristic(Characteristic.Active).value == state) {
    callback(null);
    return;
  }

  this.log("Set active to %s", state);

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .set({ set: state == Characteristic.Active.ACTIVE ? true : false })
      .then(success => {
        this.log("Set Active " + success ? "succeeded" : "failed");
        callback(success ? null : "error");
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.getTemperature = function(callback) {
  this.log("Getting current temperature...");

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .get({ dps: 3 })
      .then(temperature => {
        var percentage = Math.ceil((temperature - 15) * 5);
        this.log(
          "Returned temperature of",
          temperature + "ºC (" + percentage + "%)"
        );
        callback(null, percentage);
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.setTemperature = function(temperature, callback) {
  var temperatureIncrement = Math.ceil(temperature / 5 + 15);
  var currenttemperatureIncrement = Math.ceil(
    this.service.getCharacteristic(Characteristic.RotationSpeed).value / 5 + 15
  );
  if (currenttemperatureIncrement == temperatureIncrement) {
    callback(null);
    return;
  }

  this.log("Set temperature to %s", temperatureIncrement);

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .set({ dps: 3, set: temperatureIncrement })
      .then(success => {
        this.log("Set temperature " + success ? "succeeded" : "failed");
        callback(success ? null : "error");
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.getSwingMode = function(callback) {
  this.log("Getting current SwingMode...");

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .get({ dps: 7 })
      .then(state => {
        var swingMode = state
          ? Characteristic.SwingMode.SWING_ENABLED
          : Characteristic.SwingMode.SWING_DISABLED;
        this.log("Returned SwingMode of " + swingMode);
        callback(null, swingMode);
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.setSwingMode = function(state, callback) {
  this.log("Set SwingMode to %s", state);

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .set({
        dps: 7,
        set: state == Characteristic.SwingMode.SWING_ENABLED ? "High" : "Low"
      })
      .then(success => {
        this.log("Set SwingMode " + success ? "succeeded" : "failed");
        callback(success ? null : "error");
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.getLockPhysicalControls = function(callback) {
  this.log("Getting current light status...");

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .get({ dps: 2 })
      .then(state => {
        var lightStatus = state
          ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
          : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED;
        this.log("Returned light status of " + lightStatus);
        callback(null, lightStatus);
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.setLockPhysicalControls = function(state, callback) {
  this.log("Set light status to %s", state);

  if (this.tuyaDevice.isConnected()) {
    this.tuyaDevice
      .set({
        dps: 2,
        set:
          state == Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED
            ? true
            : false
      })
      .then(success => {
        this.log("Set light status " + success ? "succeeded" : "failed");
        callback(success ? null : "error");
      })
      .catch(err => callback(err));
  } else {
    callback("error");
  }
};

FanAccessory.prototype.getServices = function() {
  return [this.service];
};
