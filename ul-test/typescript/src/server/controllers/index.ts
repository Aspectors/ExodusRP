export const Init = async (): Promise<void> => {};
onNet('js:chat', (args) => {
  console.log('WE GOT SOMETIN');
  console.log(args);
});
