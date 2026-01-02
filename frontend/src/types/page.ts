import { PageValues } from 'constants/index'

export type PageType = (typeof PageValues)[keyof typeof PageValues]
