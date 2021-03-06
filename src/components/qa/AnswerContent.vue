<template>
  <div class="answer-content">
    <div class="content-area">
      <div
        v-if="!isEditing"
        v-html="compiledMarkdown" />

      <content-editor
        v-if="isEditing"
        v-model="answer.content"
        placeholder="Write your answer"
        ref="editor" />
    </div>

    <div class="answer-footer">
      <div class="answer-actions">
        <router-link :to="shareUrl.path" class="date">{{ formatDate(answer.date) }}</router-link>

        <span>|</span>

        <div class="cursor-pointer hover-highlight" :class="{ 'active': isMyVote }" @click="onVote">
          <i class="fa fa-lg" :class="{ 'fa-heart-o': !isMyVote, 'fa-heart': isMyVote }"></i>
          <span v-if="showLikes">{{ answer.votes.length }}</span>
        </div>

        <social-sharing
          :url="shareUrl.url"
          :href="shareUrl.url"
          :title="shareText"
          twitter-user="software_daily"
          inline-template>
          <div class="cursor-pointer hover-highlight">
            <network network="twitter">
              <i class="fa fa-lg fa-twitter" />
            </network>
          </div>
        </social-sharing>
      </div>

      <div v-if="isLoggedIn && canEdit" class="answer-edit" :class="{ 'is-disabled': isLoading }">
        <span v-if="isMyAnswer">
          <span
            class="link"
            @click="onDelete">
            Delete
          </span>

          <span
            class="link"
            @click="onEdit">
            {{ isEditing ? 'Cancel' : 'Edit' }}
          </span>
          <button
            v-show="isEditing"
            class="button-submit button-save"
            @click="onUpdate">
            Update Answer
          </button>
        </span>
      </div>
    </div>
  </div>

</template>

<script>
import marked from 'marked'
import moment from 'moment'
import isObject from 'lodash/isObject'
import { mapState, mapActions, mapGetters } from 'vuex'
import SocialSharing from 'vue-social-sharing'
import VotingArrows from '@/components/VotingArrows'
import ContentEditor from '@/components/contentEditor/ContentEditor'
import ProfileLabel from '@/components/profile/ProfileLabel'

export default {
  name: 'answer',

  props: {
    question: {
      type: String,
    },
    answer: {
      type: Object,
    },
    topicSlug: {
      type: String,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    showEmptyLikes: {
      type: Boolean,
      default: true,
    }
  },

  data () {
    return {
      isLoading: false,
      isEditing: false,
    }
  },

  components: {
    ContentEditor,
    VotingArrows,
    ProfileLabel,
    SocialSharing,
  },

  computed: {
    ...mapGetters([
      'isLoggedIn',
    ]),

    ...mapState({
      me ({ me }) {
        return me
      },

      topicpage ({ topics }) {
        return topics.topicpage
      },
    }),

    showLikes () {
      if (this.showEmptyLikes) return true
      return this.answer.votes.length
    },

    compiledMarkdown () {
      marked.setOptions({
        breaks: true
      })

      return marked(this.answer.content || '')
    },

    shareUrl () {
      const { topicpage, answer, topicSlug } = this
      const questionId = isObject(answer.question) ? answer.question._id : answer.question
      const path = `/topic/${topicpage.slug || topicSlug}/question/${questionId}#answer-${answer._id}`

      return {
        url: `${window.location.origin}${path}`,
        path,
      }
    },

    shareText () {
      let authorRef = '';
      if (this.answer && this.answer.author) {
        const { author } = this.answer
        if (author.name || author.twitter) {
          authorRef = ` by${author.name ? ` ${author.name}` : ''}${author.twitter ? ` @${author.twitter}` : ''}`
        }
      }
      return `${this.question}\n"${this.answer.content}"${authorRef}`
    },

    isMyVote () {
      const { me = {} } = this.$store.state
      return (
        this.answer.votes.indexOf(me._id) >= 0
      )
    },

    isMyAnswer () {
      const { me = {} } = this.$store.state
      return (
        this.answer &&
        this.answer.author &&
        this.answer.author._id === me._id
      )
    }
  },

  methods: {
    ...mapActions([
      'updateAnswer',
      'deleteAnswer',
      'voteAnswer',
    ]),

    formatDate (dateCreated) {
      if (dateCreated) {
        const date = moment(dateCreated).format('MMMM Do, YYYY')
        return `${date}`
      }

      return 'Now'
    },

    onVote () {
      if (!this.isLoggedIn) {
        return this.$router.push('/register')
      }

      this.voteAnswer(this.answer)
    },

    onEdit () {
      this.isEditing = !this.isEditing
    },

    async onUpdate () {
      this.isLoading = true
      await this.updateAnswer(this.answer)
      this.onEdit()
      this.isLoading = false
    },

    async onDelete () {
      this.isLoading = true
      await this.deleteAnswer(this.answer._id)
      this.isLoading = false
    }
  }
}
</script>

<style scoped lang="stylus">
.answer-content {
  .content-area {
    >>> img {
      max-width: 100%;
    }
  }
}
>>> .content-editor {
  margin-bottom: 1rem;

  .CodeMirror,
  .CodeMirror-scroll {
    min-height: 130px;
  }
}

.answer-footer {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  letter-spacing: 0.6px;
  font-weight: 600;
}

.answer-actions {
  display: flex;
  align-items: center;

  .date {
    text-transform: uppercase;
  }

  & > * {
    margin-right: 10px;
  }
}

.answer-edit {
  flex-grow: 1;
  text-align: right;

  &.is-disabled {
    pointer-events: none;
    opacity: 0.5;
  }
}

.cursor-pointer {
  cursor: pointer;
}

.link {
  color: #a591ff;
}

.hover-highlight:hover,
.hover-highlight.active {
  color: #a591ff;
}

.link,
.button-submit {
  cursor: pointer;
  margin-left: 1rem;
}
</style>
