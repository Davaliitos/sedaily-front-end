import { PlayerState } from './../utils/playerState'

export default {
  playerState: PlayerState.STOPPED,
  activePlayerPost: {title: {}},
  activeType: null,
  searchTerm: null,
  post: {},
  nextPage: 0,
  posts: {},
  popularPosts: [],
  entityComments: {}, // arrays of ids, only root comments
  comments: {}, // Map of all comments, key is comment._id
  postRelatedLinks: {},
  feed: [],
  placeholderAvatar: 'https://s3-us-west-2.amazonaws.com/sd-profile-pictures/profile-icon-9.png',
  me: {},
  users: {},
  commentsView: false,
  lists: {
    top: [],
    new: [],
    recommendation: []
  },
  chat: {
    settings: {
      displayBox: true
    },
    online: false,
    messages: []
  },
  topics: {
    all: null,
    user: null,
    post: null,
    mostPopular: null,
    searchedAllTopics: null,
    recentTopicPages: [],
    topicpage: {},
    questions: [],
    unansweredQuestions: [],
    mostPosts: [],
  },
  searchTopic: [],
  token: localStorage.getItem('token'),
  loggingEnabled: true,
  jobs: [],
  forumThreadIdsList: [],
  forumThreads: {},
  defaultMetaContent: {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@software_daily',
    'twitter:creator': '@the_prion',
    'og:url': location.origin,
    'og:title': 'Software Daily',
    'og:description': 'Software Daily podcast episodes, forum, job board and more...',
    'description': 'Software Daily podcast episodes, forum, job board and more...',
    'og:image': 'https://www.softwaredaily.com/static/sedailywords.png',
  },
  analytics: '',
  socket: null,
  notifications: []
}
