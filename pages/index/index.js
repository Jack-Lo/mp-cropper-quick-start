Page({
  data: {
    path: '',
  },
  pickAvt() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success (res) {
        const path = res.tempFilePaths[0];
        wx.navigateTo({
          url: '/pages/cropper/index',
          events: {
            onCropperConfirm(data) {
              // console.log('data:', data);
              that.setData({
                path: data.path,
              });
            },
          },
          success(res) {
            res.eventChannel.emit('acceptDataFromOpenerPage', { src: path });
          },
        });
      }
    });
  },
});
