# live.convolution

> A Max patcher for live convolution.

![live.convolution](/live.convolution.png)

The patcher takes up to 2 audio inputs, then convolved through 10 channels, each diffused to 4 output channels.

Each of the buffers for the convolution channels have the following options:
- drag and drop audio file into the buffer
- a set gain adjustment to correct for the gain from the convolution
- diffusion to the 4 output channels
- clear the channel
- undo the previous operation
- equalize (using up to 5 biquad filters)
- convolve with the buffer from previous convolution channel
- convolve with self
- adjust the channel gain

The four channel operations have a ramping time that can be adjusted. During the transition, the channel is locked until completion of the operation. The lock can be overidden with clear though.

The patcher allows individual convolution channel settings to be set, saved and loaded. Sets of 5 channel settings can be similarly set, saved and loaded.
