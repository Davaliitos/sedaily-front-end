<template>
  <topic-page-template>
    <template v-slot:content>

      <spinner :show="loading"/>

      <div
        v-if="isMaintainer && !topicPageData.published"
        class="related-container">
        Only you can see this. This topic page is private. <router-link :to="`/topic/${topicData.slug}/edit`" class="link">Click here to publish.</router-link>
      </div>

      <div class="topicpage-header">
        <h1 class="header-title">
          {{topicData.name}}
        </h1>

        <router-link
          v-if="isMaintainer"
          :to="{ path: `/topic/${$route.params.slug}/edit` }"
          class="edit-link">
          <i class="fa fa-pencil" style="margin-right:4px" /> Edit
        </router-link>

        <social-sharing
          :url="contentUrl"
          :href="contentUrl"
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

      <div v-if="topicPageData.twitterAccounts" class="related-twitter-accounts">
        <a
          v-for="user in topicPageData.twitterAccounts"
          :key="user.screen_name"
          :href="`https://twitter.com/${user.screen_name}`"
          target="_blank">
          {{user.label}}
        </a>
      </div>

      <template v-if="hasMaintainers">
        <topic-page-maintainer
          :users="topicData.maintainers"
          :topicSelect="() => onClickTopic(topicData)"
          :isMaintainer="isMaintainer">

          <div v-if="!isMaintainer" @click="() => onClickTopic(topicData)" class="link-button">
            Become a maintainer
          </div>
          <div v-else @click="() => onLeaveTopic(topicData)" class="link-button">
            Leave as maintainer
          </div>

        </topic-page-maintainer>

        <img
          v-if="topicPageData.logo"
          :src="topicPageData.logo"
          width="100%"
          class="topic-logo" />

        <div class="content-block">
          <highlightable
            :contentUrl="contentUrl"
            :forumThreadId="topicPageData._id"
            :rootEntityType="'topic'"
            :socialShareUsers="topicData.maintainers"
            :relatedTwitterAccounts="topicPageData.twitterAccounts"
            @highlight="onHighlight">
            <div v-html="highlightedContent" />
          </highlightable>
        </div>
      </template>

      <write-request
        v-else-if="!loading"
        :showTitle="false"
        :topicName="topicData.name"
        topicSelectText="Become a maintainer"
        learnMoreText="What is a topic page?"
        :topicSelect="() => onClickTopic(topicData)">
      </write-request>

      <div class="content-block pre-unformatted">
        <question-add
          :entity="topicData"
          entityType="topic"
          @onQuestionAdded="onQuestionChanged"/>

        <question
          v-for="question in questions"
          :key="question._id"
          :topicSlug="topicData.slug"
          :answerLimit="1"
          :question="question"
          :relatedTwitterAccounts="topicPageData.twitterAccounts"
          @onChange="onQuestionChanged" />
      </div>
    </template>

    <template v-slot:side>
      <div class="related-container">
        <h6>Related Episodes</h6>
        <spinner :show="loadingEpisodes"/>
        <router-link
          class="episode-link"
          v-for="episode in relatedEpisodes"
          :key="episode._id"
          :to="{ name: 'Post', params: { id: episode._id, postTitle: episode.slug} }" >
          {{episode.title.rendered}}
        </router-link>
        <div v-if="relatedEpisodes.length < relatedEpisodesTotal" class="total">
          <router-link
            class="episode-see-all-link"
            :to="`/posts/${$route.params.slug}`">
            See all {{relatedEpisodesTotal}}
          </router-link>
        </div>
        <div v-if="!relatedEpisodesTotal && !loadingEpisodes" class="no-episodes">
          0 Episodes
        </div>
        <div v-if="isLoggedIn" class="related-input">
          <spinner :show="savingRelatedEpisode"/>
          <SelectPostInput
            v-show="!savingRelatedEpisode"
            v-model="newRelatedEpisode"
            @onChange="onChangeRelatedEpisode"
            placeholder="Add a related episode" />
        </div>
      </div>

      <related-link-list
        v-if="relatedQuestions.length"
        :headline="'Related Questions'"
        :related-links="relatedQuestions"
        :isTruncated="false"
        :is-logged-in="isLoggedIn" />

      <related-link-list
        :headline="'Related Jobs'"
        :related-links="relatedJobs"
        :isTruncated="false"
        :is-logged-in="isLoggedIn">
        <div v-if="topicData._id" class="total">
          <router-link
            class="episode-see-all-link"
            :to="`/add-job/?topicId=${topicData._id}`">
            Add Jobs
          </router-link>
        </div>
      </related-link-list>

      <comments-list
        :filter="'highlight'"
        :initialComment="''"
        :post="{}"
        :isPreview="true"
        :forumThreadId="topicPageData._id"
        :relatedTwitterAccounts="topicPageData.twitterAccounts"
        :rootEntityType="'topic'"
        :commentCount="highlightCount"
        :comments="comments" />

      <post-highlights
        :highlight="highlight"
        :comments="comments"
        :commentCount="highlightCount"
        :rootEntityType="'topic'"
        :socialShareUsers="topicData.maintainers"
        :relatedTwitterAccounts="topicPageData.twitterAccounts"
        :post="{}" />
    </template>
  </topic-page-template>
</template>

<script>
import find from 'lodash/find'
import isArray from 'lodash/isArray'
import { mapState, mapGetters, mapActions } from 'vuex'
import SocialSharing from 'vue-social-sharing'
import Spinner from '@/components/Spinner'
import RelatedLinkList from '@/components/related/RelatedLinkList'
import { TopicPageTemplate, TopicPageMaintainer } from '@/views/topic'
import WriteRequest from '@/views/write/WriteRequest'
import Avatar from '@/components/Avatar'
import Question from '@/components/qa/Question'
import QuestionAdd from '@/views/question/QuestionAdd'
import CommentsList from '@/components/comment/CommentsList'
import { parseIdsIntoComments } from '@/utils/comment.utils'
import { cleanContent, formatList } from '@/utils/post.utils'
import Highlightable from '@/components/Highlightable'
import { PostHighlights } from '@/components/post'
import SelectPostInput from '@/components/SelectPostInput'

export default {
  name: 'topicpage-content',

  components: {
    Spinner,
    Question,
    SocialSharing,
    TopicPageMaintainer,
    TopicPageTemplate,
    RelatedLinkList,
    Avatar,
    WriteRequest,
    CommentsList,
    Highlightable,
    PostHighlights,
    SelectPostInput,
    QuestionAdd
  },

  beforeMount () {
    this.loadTopic()
  },

  data () {
    return {
      loading: false,
      loadingEpisodes: false,
      loadingJobs: false,
      savingRelatedEpisode: false,
      relatedTwitterAccounts: [],
      topicData: {},
      topicPageData: {},
      highlight: '',
      relatedJobs: [],
      relatedEpisodes: [],
      relatedEpisodesTotal: 0,
      selectedTopic: '',
      newRelatedEpisode: {}
    }
  },

  computed: {
    ...mapGetters([
      'isLoggedIn',
      'metaTag'
    ]),

    ...mapState({
      me (state) {
        return state.me
      },

      commentsMap (state) {
        return state.comments
      },

      entityComments (state) {
        return state.entityComments
      },

      questions ({ topics }) {
        return topics.questions
      },

      topicpage ({ topics }) {
        return topics.topicpage
      },
    }),

    contentUrl () {
      return window.location.href
    },

    shareGuests () {
      return (this.topicPageData.twitterAccounts || [])
        .map(user => user.screen_name ? `@${user.screen_name}` : '')
        .filter(user => !!(user.trim()))
        .join(' ')
    },

    shareText () {
      const end = ` ${this.shareGuests}`
      const trimCount = Math.max(280 - end.length, 24)
      const question = this.topicData.name
      const relatedTwitter = this.getMaintainerTwitter()

      return `${question.slice(0, trimCount)}${question.length > trimCount ? '...' : ''}${relatedTwitter}${end}`
    },

    hasMaintainers () {
      return (
        isArray(this.topicData.maintainers) &&
        this.topicData.maintainers.length
      )
    },

    isMaintainer () {
      return !!(
        this.topicData &&
        this.me &&
        isArray(this.topicData.maintainers) &&
        find(this.topicData.maintainers, { _id: this.me._id })
      )
    },

    comments () {
      if (!this.entityComments || !this.entityComments[this.topicPageData._id]) {
        return []
      }

      const parentCommentIds = this.entityComments[this.topicPageData._id] || []

      return parseIdsIntoComments({
        entityParentCommentIds: parentCommentIds,
        commentsMap: this.commentsMap
      })
    },

    commentCount () {
      if (!this.comments) {
        return 0
      }

      let comments = this.comments.filter(c => !(c.highlight))
      let commentCount = comments.length

      comments.forEach(c => {
        commentCount += (c.replies || [])
          .filter(c => !c.deleted)
          .length
      })

      return commentCount
    },

    highlightedContent () {
      const content = this.topicPageData.content || ''
      return this.highlightContent(content)
    },

    highlightCount () {
      if (!this.comments || !isArray(this.comments)) {
        return 0
      }

      let comments = this.comments.filter(c => !!(c.highlight))
      let commentCount = comments.length

      comments.forEach(c => {
        commentCount += (c.replies || [])
          .filter(c => !c.deleted)
          .length
      })

      return commentCount
    },

    relatedQuestions () {
      if (!this.questions || !isArray(this.questions)) {
        return []
      }

      return this.questions.map(question => ({
        ...question,
        title: question.content,
        url: `${window.location.origin}/topic/${question.entityId}/question/${question._id}`,
        target: '_self',
      }))
    },
  },

  watch: {
    $route(to, from) {
      if (from.params.slug !== to.params.slug) {
        this.loadTopic()
      }
    },

    async topicpage ({ topicId }) {
      const hasQuestions = (
        topicId &&
        isArray(this.questions) &&
        this.questions.length > 0 &&
        find(this.questions, { entityId: topicId })
      )

      if (!topicId || hasQuestions) {
        return
      }

      await this.getEntityQuestions({
        entityId: topicId,
        entityType: 'topic',
      })

      // Handle redirect if no valid content
      if (
        this.topicData &&
        this.topicData.maintainer &&
        !this.isMaintainer &&
        !this.topicPageData.published &&
        !this.questions.length) {
        return this.redirectToPosts()
      }
    }
  },

  methods: {
    ...mapActions([
      'getTopicPage',
      'commentsFetch',
      'setMaintainer',
      'removeMaintainer',
      'getTopicEpisodes',
      'getTopicJobs',
      'saveTopicEpisode',
      'getEntityQuestions',
    ]),

    getMaintainerTwitter () {
      if (!this.hasMaintainers) {
        return ''
      }

      const maintainersWithTwitter = this.topicData.maintainers
        .sort((a, b) => new Date(b.dateUpdated) - new Date(a.dateUpdated))
        .filter(m => !!(m.twitter))

      return maintainersWithTwitter.length > 0 ? ` @${maintainersWithTwitter[0].twitter} ` : ''
    },

    async requestTopicOwnership() {
      this.saving = true

      const data = {
        topicSlug: this.selectedTopic,
        event: 'selfAssign'
      }

      try {
        await this.setMaintainer(data)
        this.$router.push({
          name: 'TopicPageEdit',
          params: { slug: this.selectedTopic }
        })
      }
      catch (e) {
        this.$toasted.error((e.response) ? e.response.data : e)
      }

      this.saving = false
    },

    async loadTopic () {
      const { slug } = this.$route.params

      if (!this.topicpage || this.topicpage && this.topicpage.slug !== slug) {
        this.loading = true
      }

      try {
        const data = await this.getTopicPage(slug)
        const topicPage = data.topicPage || {}
        const { content } = topicPage

        this.topicData = data.topic
        this.topicPageData = {
          ...topicPage,
          content: cleanContent(content),
        }

        // Fetch comments
        if (topicPage._id) {
          this.commentsFetch({ entityId: topicPage._id })
        }

        this.loadEpisodes()
        this.loadJobs()
      }
      catch (e) {
        if (e.response && e.response.status === 404) {
          return this.redirectToPosts()
        }

        this.$toasted.error((e.response) ? e.response.data : e)
      }

      this.loading = false
    },

    onQuestionChanged () {
      if (!this.topicData || !this.topicData._id) return

      this.getEntityQuestions({
        entityId: this.topicData._id,
        entityType: 'topic',
      })
    },

    redirectToPosts () {
      this.$router.replace(`/posts/${this.$route.params.slug}`)
    },

    onClickTopic (topic) {
      if (!this.me || !this.me._id) {
        return this.$router.push(`/register`)
      }

      this.selectedTopic = topic.slug
      this.$nextTick(() => {
        this.requestTopicOwnership()
      })
    },

    async onLeaveTopic (topic) {
      this.saving = true

      const data = {
        topicSlug: topic.slug,
        event: 'selfUnassign',
      }

      try {
        await this.removeMaintainer(data)
        this.loadTopic()
      }
      catch (e) {
        this.$toasted.error((e.response) ? e.response.data : e)
      }

      this.saving = false
    },

    loadEpisodes () {
      this.loadingEpisodes = true
      this.getTopicEpisodes(this.$route.params.slug).then((data) => {
        if (data && data.episodes) {
          this.relatedEpisodes = data.episodes
          this.relatedEpisodesTotal = data.total
        }
      }).catch((e) => {
        if (e.response && e.response.status === 404) {
          this.relatedEpisodes = 0
          this.relatedEpisodesTotal = 0
          return
        }
        this.$toasted.error((e.response) ? e.response.data : e, { duration : 0 })
      }).finally(() => {
        this.loadingEpisodes = false
      })
    },

    async loadJobs () {
      this.loadingJobs = true

      try {
        const { jobs = [] } = await this.getTopicJobs(this.$route.params.slug)

        this.relatedJobs = jobs
          .map(job => ({
            ...job,
            url: `${window.location.origin}/jobs/${job._id}`,
            target: '_self',
          }))
      }
      catch (e) {
        if (e.response && e.response.status === 404) {
          this.relatedJobs = []
          return
        }

        this.$toasted.error((e.response) ? e.response.data : e, { duration : 0 })
      }

      this.loadingJobs = false
    },

    onHighlight (highlight = '') {
      this.$set(this, 'highlight', highlight)
    },

    highlightContent (content = '') {
      let comments = (this.comments || [])
        .filter(c => !!(c.highlight))

      comments.forEach(c => {
        content = content.replace(c.highlight, h => {
          return `<mark
            data-entity-id="${c.rootEntity}"
            data-parent-comment-id="${c._id}">${h}</mark>`
        })
      })

      return content
    },

    onChangeRelatedEpisode () {
      this.savingRelatedEpisode = true

      const options = {
        slug: this.$route.params.slug,
        postSlug: this.newRelatedEpisode.slug
      }

      this.saveTopicEpisode(options).then((data) => {
        this.loadEpisodes()
      }).catch((e) => {
        this.$toasted.error((e.response) ? e.response.data : e, { duration : 0 })
      }).finally(() => {
        this.savingRelatedEpisode = false
        this.newRelatedEpisode = {}
      })
    }
  },

  metaInfo() {
    if (!this.topicData || !this.topicData.name) {
      return {}
    }

    const title = `${this.topicData.name} | Software Daily`
    const featuredImage = this.topicPageData.logo || ''

    return {
      title,
      meta: [
        this.metaTag('og:title', title),
        this.metaTag('og:url', location.href),
        // links must use https
        this.metaTag('og:image', featuredImage.replace('http://','https://'))
      ]
    }
  }
}
</script>

<style scoped lang="stylus">
  .topic-page
    margin-top 5px

  .spinner
    margin 0 auto
    display block

  .link
    font-weight 700
    color #1a0dab
    text-decoration underline

  .link-button
    cursor pointer
    display inline-block
    margin-top 10px
    padding 4px 12px
    color #a591ff
    background-color transparent
    border 1px solid #a591ff
    border-radius 18px

    &:hover
      color #ffffff
      background-color #a591ff

  .edit-link
    border 1px solid #222
    padding 7px 10px
    font-size 12px
    font-weight normal
    color #222
    border-radius 30px
    margin-left 10px

    &:hover
      text-decoration none

    & + .cursor-pointer
      margin-left 1rem

  .cursor-pointer
    cursor pointer

  .content-block,
  >>> .write-view
    margin-bottom 4rem

  .related-twitter-accounts
    list-style none
    margin 0 0 14px
    padding 0

    a
      display inline-block
      font-weight 700
      text-decoration none

      &:hover
        text-decoration underline

      &::before
        content ' ,'

      &:first-child
        margin-left 4px

        &::before
          content ''

    li::after
      content ', '

  .related-container
    margin 0 0 20px
    padding 1.5rem
    background #e9ecef

    h6
      margin-top 0 0 10px
      text-transform uppercase
      font-size 0.8rem
      font-weight 800

    .episode-link
      display block
      margin 10px 0
      font-size 14px
      font-weight normal
      color #1a0dab

    .total
      text-align center

      .episode-see-all-link
        color #9b9b9b

    .no-episodes
      color #9b9b9b
      text-align center
      margin-top 20px

    .related-input
      margin-top 10px

      .spinner
        width 40px
        height 40px

      &>>> input
      outline none
      border 0

      &:focus
        outline none
        -webkit-box-shadow 0 0 3px 3px rgba(165,145,255,0.4)
        box-shadow 0 0 3px 3px rgba(165,145,255,0.4)

  >>> mark
    cursor pointer
    font-weight 700
    color #fff
    background-color #a591ff
    opacity 0.7
    &::selection
      background-color #a591ff
    &:hover
      opacity 1.0

</style>
