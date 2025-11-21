// Sanity 클라이언트 API Stub
const mockSanity = {
  fetch: () => Promise.resolve({}),
  patch: function () {
    return this
  },
  set: function () {
    return this
  },
  commit: () => Promise.resolve({}),
}

export default mockSanity
