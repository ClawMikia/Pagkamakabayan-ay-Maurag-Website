(function () {
  "use strict";

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      if (!src) {
        reject(new Error("No board image source provided."));
        return;
      }
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("Failed to load board image."));
      };
      img.src = src;
    });
  }

  function toGray(image) {
    var targetWidth = Math.min(image.naturalWidth || image.width || 480, 480);
    var ratio = targetWidth / (image.naturalWidth || image.width || targetWidth);
    var width = Math.max(1, Math.round(targetWidth));
    var height = Math.max(1, Math.round((image.naturalHeight || image.height || targetWidth) * ratio));
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    var raw = context.getImageData(0, 0, width, height).data;
    var gray = new Float32Array(width * height);
    for (var i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = 0.299 * raw[p] + 0.587 * raw[p + 1] + 0.114 * raw[p + 2];
    }
    return { gray: gray, width: width, height: height };
  }

  function lineProfile(gray, width, height) {
    var profile = new Float32Array(width);
    var min = 255;
    var max = 0;
    for (var x = 0; x < width; x++) {
      var sum = 0;
      for (var y = 0; y < height; y++) {
        var value = gray[y * width + x];
        sum += value;
        if (value < min) min = value;
        if (value > max) max = value;
      }
      profile[x] = sum / height;
    }
    var threshold = (min + max) / 2;
    for (var i = 0; i < width; i++) {
      profile[i] = profile[i] < threshold ? 1 : 0;
    }
    return profile;
  }

  function findLineCenters(profile, length) {
    var lines = [];
    var start = -1;
    for (var x = 0; x < length; x++) {
      if (profile[x] && start < 0) {
        start = x;
      } else if (!profile[x] && start >= 0) {
        lines.push((start + x - 1) / 2);
        start = -1;
      }
    }
    if (start >= 0) {
      lines.push((start + length - 1) / 2);
    }
    return lines;
  }

  function detect(src) {
    return loadImage(src)
      .then(function (image) {
        try {
          var data = toGray(image);
          var vertical = lineProfile(data.gray, data.width, data.height);
          var transposed = new Float32Array(data.width * data.height);
          for (var y = 0; y < data.height; y++) {
            for (var x = 0; x < data.width; x++) {
              transposed[x * data.height + y] = data.gray[y * data.width + x];
            }
          }
          var horizontal = lineProfile(transposed, data.height, data.width);

          var vLines = findLineCenters(vertical, data.width);
          var hLines = findLineCenters(horizontal, data.height);

          if (
            vLines.length >= 9 &&
            vLines.length <= 11 &&
            hLines.length >= 9 &&
            hLines.length <= 11
          ) {
            var insetX = vLines[0] / data.width;
            var insetY = hLines[0] / data.height;
            return {
              inset: Math.min((insetX + insetY) / 2, 0.14),
              cols: vLines.length - 1,
              rows: hLines.length - 1,
              detected: true
            };
          }
          return { inset: 0, cols: 9, rows: 9, detected: false };
        } catch (error) {
          return { inset: 0, cols: 9, rows: 9, detected: false };
        }
      })
      .catch(function () {
        return { inset: 0, cols: 9, rows: 9, detected: false };
      });
  }

  window.BoardTiles = { detect: detect };
})();
