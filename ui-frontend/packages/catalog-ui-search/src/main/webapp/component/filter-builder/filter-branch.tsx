import * as React from 'react'
import { hot } from 'react-hot-loader'
import Paper from '@material-ui/core/Paper'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import FilterLeaf from './filter-leaf'
import { useTheme } from '@material-ui/core/styles'
import { HoverButton } from '../button/hover'
import {
  FilterBuilderClass,
  FilterClass,
  isFilterBuilderClass,
} from './filter.structure'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import AddIcon from '@material-ui/icons/Add'
import { useTransition, animated, useSpring, State } from 'react-spring'
import useResizeObserver from 'use-resize-observer'
import _ from 'lodash'
const OperatorData = [
  {
    label: 'AND',
    value: 'AND',
  },
  {
    label: 'OR',
    value: 'OR',
  },
  {
    label: 'NOT AND',
    value: 'NOT AND',
  },
  {
    label: 'NOT OR',
    value: 'NOT OR',
  },
]

type ChildFilterProps = {
  parentFilter: FilterBuilderClass
  filter: FilterBuilderClass | FilterClass
  setFilter: (filter: FilterBuilderClass) => void
  index: number
  isFirst: boolean
  isLast: boolean
  transitionState: State
}

const ChildFilter = ({
  transitionState,
  parentFilter,
  filter,
  setFilter,
  index,
  isFirst,
  isLast,
}: ChildFilterProps) => {
  const [viewHeight, setViewHeight] = React.useState(0)
  const memoSetViewHeight = React.useMemo(() => {
    return _.debounce((height: number) => {
      setViewHeight(height)
    }, 0)
  }, [])
  const { ref } = useResizeObserver({
    onResize: ({ height }) => {
      memoSetViewHeight(height || 0)
    },
  })
  const springProps = useSpring({
    from: { height: 0 },
    to: { height: transitionState !== 'leave' ? viewHeight : 0 },
  })
  console.log(transitionState)
  console.log(springProps)
  return (
    <animated.div
      style={{
        ...(transitionState === 'update' ? springProps : springProps),
        overflow: transitionState !== 'update' ? 'hidden' : 'initial',
      }}
    >
      <div ref={ref as any}>
        {!isFirst ? (
          <Grid
            container
            direction="row"
            alignItems="center"
            justify="center"
            wrap="nowrap"
          >
            <Grid item className="p-4">
              <TextField
                value={parentFilter.operator}
                onChange={e => {
                  const newOperator = e.target
                    .value as FilterBuilderClass['operator']
                  setFilter({
                    ...parentFilter,
                    operator: newOperator,
                  })
                }}
                select
                variant="outlined"
              >
                {OperatorData.map(operatorInfo => {
                  return (
                    <MenuItem
                      key={operatorInfo.value}
                      value={operatorInfo.value}
                    >
                      {operatorInfo.label}
                    </MenuItem>
                  )
                })}
              </TextField>
            </Grid>
          </Grid>
        ) : null}
        {isFilterBuilderClass(filter) ? (
          <FilterBranch
            filter={filter}
            setFilter={newChildFilter => {
              const newFilters = parentFilter.filters.slice(0)
              newFilters.splice(index, 1, newChildFilter)
              setFilter({
                ...parentFilter,
                filters: newFilters,
              })
            }}
          />
        ) : (
          <FilterLeaf
            filter={filter}
            setFilter={newChildFilter => {
              const newFilters = parentFilter.filters.slice(0)
              newFilters.splice(index, 1, newChildFilter)
              setFilter({
                ...parentFilter,
                filters: newFilters,
              })
            }}
          />
        )}
        {!isFilterBuilderClass(filter) ? (
          <Grid item className="w-full filter-actions">
            <Grid
              container
              direction="row"
              alignItems="center"
              className="w-full"
            >
              {isLast ? (
                <>
                  <Grid item>
                    <Button
                      onClick={() => {
                        setFilter({
                          ...parentFilter,
                          filters: parentFilter.filters.concat([
                            new FilterClass({ parent: parentFilter }),
                          ]),
                        })
                      }}
                    >
                      <AddIcon />
                      <Box color="primary.main">Field</Box>
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={() => {
                        setFilter({
                          ...parentFilter,
                          filters: parentFilter.filters.concat([
                            new FilterBuilderClass(),
                          ]),
                        })
                      }}
                    >
                      <AddIcon />
                      <Box color="primary.main">Group</Box>
                    </Button>
                  </Grid>
                </>
              ) : null}
              <Grid item className="ml-auto">
                <Button
                  onClick={() => {
                    const newFilters = parentFilter.filters.slice(0)
                    newFilters.splice(index, 1)
                    setFilter({
                      ...parentFilter,
                      filters: newFilters,
                    })
                  }}
                >
                  <Box color="primary.main">Remove</Box>
                </Button>
              </Grid>
            </Grid>
          </Grid>
        ) : null}
      </div>
    </animated.div>
  )
}

type Props = {
  filter: FilterBuilderClass
  setFilter: (filter: FilterBuilderClass) => void
}

const FilterBranch = ({ filter, setFilter }: Props) => {
  const [hover, setHover] = React.useState(false)
  const theme = useTheme()
  const transitions = useTransition(
    filter.filters,
    childFilter => childFilter.id,
    {
      from: { opacity: '0' },
      enter: { opacity: '1' },
      leave: { opacity: '0' },
    }
  )

  /**
   * Any non root branches lacking filters are pruned.
   */
  React.useEffect(
    () => {
      filter.filters.forEach((childFilter, index) => {
        if (
          isFilterBuilderClass(childFilter) &&
          childFilter.filters.length === 0
        ) {
          const newFilters = filter.filters.slice(0)
          newFilters.splice(index, 1)
          setFilter({
            ...filter,
            filters: newFilters,
          })
        }
      })
    },
    [filter]
  )

  return (
    <div
      onMouseEnter={() => {
        setHover(true)
      }}
      onMouseOver={() => {
        setHover(true)
      }}
      onMouseOut={() => {
        setHover(false)
      }}
      onMouseLeave={() => {
        setHover(false)
      }}
    >
      <Paper elevation={10} className="p-2 ">
        <div className="relative">
          {filter.negated ? (
            <HoverButton
              className={`absolute left-0 transform -translate-y-1/2 py-0 px-1 text-xs z-10`}
              color="primary"
              variant="contained"
              onClick={() => {
                setFilter({
                  ...filter,
                  negated: !filter.negated,
                })
              }}
            >
              {({ hover }) => {
                if (hover) {
                  return <>Remove Not</>
                } else {
                  return <>NOT</>
                }
              }}
            </HoverButton>
          ) : (
            <Button
              className={`${
                hover ? 'opacity-100' : 'opacity-0'
              } focus:opacity-100 transition-opacity duration-200 absolute left-0 transform -translate-y-1/2 py-0 px-1 text-xs z-10`}
              color="primary"
              variant="contained"
              onClick={() => {
                setFilter({
                  ...filter,
                  negated: !filter.negated,
                })
              }}
            >
              + Not
            </Button>
          )}
          <div
            className={`${
              filter.negated ? 'border px-3 py-4 mt-2' : ''
            } transition-all duration-200`}
            style={{
              borderColor: theme.palette.primary.main,
            }}
          >
            {transitions.map(
              ({ item: childFilter, key, props, state }, index) => {
                return (
                  <animated.div key={key} style={props}>
                    <ChildFilter
                      transitionState={state}
                      parentFilter={filter}
                      filter={childFilter}
                      setFilter={setFilter}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === filter.filters.length - 1}
                    />
                  </animated.div>
                )
              }
            )}
            {filter.filters.length >= 1 &&
            !isFilterBuilderClass(filter.filters[filter.filters.length - 1]) ? (
              <></>
            ) : (
              <Grid item className="w-full filter-actions">
                <Grid
                  container
                  direction="row"
                  alignItems="center"
                  className="w-full"
                >
                  <Grid item>
                    <Button
                      onClick={() => {
                        setFilter({
                          ...filter,
                          filters: filter.filters.concat([
                            new FilterClass({ parent: filter }),
                          ]),
                        })
                      }}
                    >
                      <AddIcon />
                      <Box color="primary.main">Field</Box>
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={() => {
                        setFilter({
                          ...filter,
                          filters: filter.filters.concat([
                            new FilterBuilderClass(),
                          ]),
                        })
                      }}
                    >
                      <AddIcon />
                      <Box color="primary.main">Group</Box>
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </div>
        </div>
      </Paper>
    </div>
  )
}
export default hot(module)(FilterBranch)