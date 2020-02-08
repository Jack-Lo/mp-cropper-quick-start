Page({
  data: {
    sysInfo: wx.getSystemInfoSync(),
    src: '',
    crop: 0,
  },
  onLoad() {
    this.eventChannel = this.getOpenerEventChannel();
    this.initSrc();
  },
  initSrc() {
    const that = this;
    const { eventChannel } = this;
    if (!eventChannel || !eventChannel.on) {
      // that.setData({
      //   src: 'http://tmp/wxef6bf5efcb99c709.o6zAJs_-mVG8V5AM70JDTuAGUwDY.K9u3TPOYt5zHc8785d8753c769ce9a9b2f40f35807ef.jpeg',
      //   // src: 'http://tmp/wxef6bf5efcb99c709.o6zAJs_-mVG8V5AM70JDTuAGUwDY.dl6xm5vCm3MS6b26e70fa7216f2485cc137063a4ac99.JPG',
      // });
      return;
    }
    eventChannel.on('acceptDataFromOpenerPage', (data) => {
      that.setData({
        src: data.src,
      });
    });
  },
  onCropperCrop(e) {
    const { detail } = e;
    wx.navigateBack();
    const { eventChannel } = this;
    if (!eventChannel || !eventChannel.emit) {
      return;
    }
    eventChannel.emit('onCropperConfirm', { path: detail.path });
  },
  onCropperError(err) {
    console.error(err);
  },
  cancel() {
    wx.navigateBack();
  },
  confirm() {
    this.setData({
      crop: new Date().getTime(),
    });
  },
});
