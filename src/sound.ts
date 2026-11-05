function loadSound(file: string) {
  return new Audio(`${import.meta.env.BASE_URL}sounds/${file}.m4a`)
}

const sounds = {
  computer: loadSound('computer-mouse'),
  diary: loadSound('diary-open'),
  page: loadSound('diary-page-turn'),
  lamp: loadSound('lamp-switch'),
  cat: loadSound('cat-meow'),
}

export function playRoomSound(name: keyof typeof sounds) {
  const sound = sounds[name]
  sound.currentTime = 0
  // Media errors and browser playback restrictions must not interrupt the interaction.
  void sound.play().catch(() => {})
}
