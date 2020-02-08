const CROPPER_CVS_ID = 'mp_cropper_cvs_id';
const CROPPER_FRONT_CVS_ID = 'mp_cropper_front_cvs_id';
const DRAG_DELAY = 10;

Component({
  properties: {
    width: {
      type: Number,
      value: 480,
    },
    height: {
      type: Number,
      value: 480,
    },
    src: {
      type: String,
      value: '',
    },
    rectWidth: {
      type: Number,
      value: 200,
    },
    rectHeight: {
      type: Number,
      value: 200,
    },
    crop: {
      type: Number,
      value: 0,
      observer(nV, oV) {
        if (nV && nV !== oV) {
          this.crop();
        }
      },
    },
  },
  data: {
    CROPPER_CVS_ID,
    CROPPER_FRONT_CVS_ID,
  },
  created() {
    this.touches = [];
    this.dragTimer = null;
  },
  attached() {
    const that = this;
    this.ctx = wx.createCanvasContext(CROPPER_CVS_ID, this);
    this.frontCtx = wx.createCanvasContext(CROPPER_FRONT_CVS_ID, this);
    this.initConfig()
      .then(() => {
        that.drawCvs();
        that.drawFrontCvs();
      })
      .catch(that.onError);
  },
  detached() {
    //
  },
  methods: {
    /**
     * 初始化配置信息
     */
    initConfig() {
      const that = this;
      const {
        width, height,
        rectWidth, rectHeight,
        src,
      } = this.data;

      this.bgInfo = {
        width,
        height,
        x: 0,
        y: 0,
        bgColor: '#000000',
      };

      const rectW = width > rectWidth ? rectWidth : width;
      const rectH = height > rectHeight ? rectHeight : height;
      this.rectInfo = {
        width: rectW,
        height: rectH,
        x: (width - rectW) / 2,
        y: (height - rectH) / 2,
        lineWidth: 1,
        maskBgColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: '#ffffff',
      };

      return new Promise((res, rej) => {
        wx.getImageInfo({
          src,
          success(r1) {
            let w = r1.width;
            let h = r1.height;
            const ratio = w / h;

            that.picInfo = {
              width: 0,
              height: 0,
              nativeWidth: r1.width,
              nativeHeight: r1.height,
              x: 0,
              y: 0,
              ratio,
            };

            that.adjustPicToRect();

            res();
          },
          fail(err) {
            rej(err);
          },
        });
      });
    },
    /**
     * 绘制背景
     */
    fillBg() {
      const { ctx, bgInfo } = this;

      ctx.save();

      ctx.setFillStyle(bgInfo.bgColor);
      ctx.fillRect(0, 0, bgInfo.width, bgInfo.height);

      ctx.restore();
    },
    /**
     * 绘制框
     */
    drawRect() {
      const { frontCtx, rectInfo, bgInfo } = this;

      frontCtx.save();

      frontCtx.setFillStyle(rectInfo.maskBgColor);
      frontCtx.fillRect(0, 0, bgInfo.width, bgInfo.height);
      frontCtx.clearRect(rectInfo.x, rectInfo.y, rectInfo.width, rectInfo.height);

      frontCtx.setStrokeStyle(rectInfo.borderColor);
      frontCtx.setLineWidth(rectInfo.lineWidth);
      frontCtx.strokeRect(rectInfo.x, rectInfo.y, rectInfo.width, rectInfo.height);

      frontCtx.restore();
    },
    /**
     * 绘制图片
     */
    drawPic() {
      const { picInfo, ctx } = this;
      const { src } = this.data;
      ctx.drawImage(src, picInfo.x, picInfo.y, picInfo.width, picInfo.height);
    },
    /**
     * 绘制画布
     */
    drawCvs() {
      const { ctx, bgInfo } = this;
      ctx.clearRect(bgInfo.x, bgInfo.y, bgInfo.width, bgInfo.height);
      this.fillBg();
      this.drawPic();
      ctx.draw();
    },
    /**
     * 绘制前景
     */
    drawFrontCvs() {
      const { frontCtx } = this;
      this.drawRect();
      frontCtx.draw();
    },
    /**
     * 触摸屏幕
     */
    startTap(event) {
      const { touches } = event;
      this.touches = touches;
    },
    /**
     * 离开屏幕
     */
    endTap(event) {
      const { touches } = event;
      this.touches = touches;
      if (!touches.length) {
        this.adjustPicToRect();
        this.drawCvs();
      }
    },
    /**
     * 拖动
     */
    drag(event) {
      const {
        picInfo,
      } = this;
      const { touches } = event;
      const preTouches = this.touches;
      let point = null;
      let prePoint = null;
      const touchesLen = touches.length;
      const preTouchesLen = preTouches.length;
      let scale = 1;
      if (preTouchesLen > 1) {
        const [p1, p2] = touches;
        const [pp1, pp2] = preTouches;
        point = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        prePoint = {
          x: (pp1.x + pp2.x) / 2,
          y: (pp1.y + pp2.y) / 2,
        };
        const s1 = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
        const s2 = Math.sqrt((pp2.x - pp1.x) * (pp2.x - pp1.x) + (pp2.y - pp1.y) * (pp2.y - pp1.y));
        scale = s1 / s2;
      } else if (touchesLen > 0) {
        point = touches[0];
        prePoint = preTouches[0];
      } else {
        return;
      }
      picInfo.x += point.x - prePoint.x;
      picInfo.y += point.y - prePoint.y;
      picInfo.width *= scale;
      picInfo.height *= scale;
      this.touches = touches;
      this.drawCvs();
    },
    /**
     * 函数去抖
     */
    dragDebance(e) {
      clearTimeout(this.dragTimer);
      this.dragTimer = setTimeout(() => {
        this.drag(e);
      }, DRAG_DELAY);
    },
    /**
     * 调节图片适应选框
     */
    adjustPicToRect() {
      const { picInfo, rectInfo } = this;
      const pW = picInfo.width;
      const pH = picInfo.height;
      const pR = picInfo.ratio;
      const rW = rectInfo.width;
      const rH = rectInfo.height;
      if (pW >= rW && pH >= rH) {
        return;
      }
      if (pW < rW) {
        picInfo.width = rW;
        picInfo.height = rW / pR;
        picInfo.x = rectInfo.x;
        picInfo.y = rectInfo.y + (rH - picInfo.height) / 2;
      }
      if (picInfo.height < rH) {
        picInfo.height = rH;
        picInfo.width = rH * pR;
        picInfo.y = rectInfo.y;
        picInfo.x = rectInfo.x + (rW - picInfo.width) / 2;
      }
    },
    /**
     * 裁切
     */
    crop() {
      const that = this;
      const { rectInfo } = this;
      const {
        width, height, x, y,
      } = rectInfo;

      wx.showLoading({
        title: '正在裁剪图片',
        mask: true,
      });

      wx.canvasToTempFilePath({
        x,
        y,
        width,
        height,
        canvasId: CROPPER_CVS_ID,
        fileType: 'jpg',
        quality: 0.8,
        success(r1) {
          wx.hideLoading();
          that.triggerEvent('crop', {
            path: r1.tempFilePath,
          });
        },
        fail(err) {
          wx.hideLoading();
          that.onError(err);
        },
      }, this);
    },
    /**
     * 错误
     */
    onError(err) {
      this.triggerEvent('error', err);
    },
  },
});
