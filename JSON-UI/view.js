/* GENERATED from view.json - edit view.json, not this file */
const STARSHIP_VIEW = [
  {
    "type": "StatusBanner",
    "props": {
      "label": "ZBOOK",
      "tone": "nominal",
      "detail": "status resolved at render time"
    }
  },
  {
    "type": "Row",
    "props": {
      "cols": 2
    },
    "children": [
      {
        "type": "Panel",
        "props": {
          "title": "BRIEFING - NEEDS ATTENTION (ZBOOK)",
          "tone": "critical"
        },
        "children": [
          {
            "type": "Field",
            "props": {
              "label": "status",
              "valuePath": "zbook.status",
              "tone": "attention"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "window (h)",
              "valuePath": "zbook.windowH",
              "tone": "muted"
            }
          },
          {
            "type": "Note",
            "props": {
              "text": "S1 - act now",
              "tone": "muted"
            }
          },
          {
            "type": "Repeat",
            "props": {
              "fromPath": "zbook.sev1",
              "emptyText": "none"
            },
            "children": [
              {
                "type": "Field",
                "props": {
                  "label": "S1",
                  "valuePath": "$item",
                  "tone": "critical"
                }
              }
            ]
          },
          {
            "type": "Note",
            "props": {
              "text": "S2 - needs attention",
              "tone": "muted"
            }
          },
          {
            "type": "Repeat",
            "props": {
              "fromPath": "zbook.sev2",
              "emptyText": "none"
            },
            "children": [
              {
                "type": "Field",
                "props": {
                  "label": "S2",
                  "valuePath": "$item",
                  "tone": "attention"
                }
              }
            ]
          }
        ]
      },
      {
        "type": "Panel",
        "props": {
          "title": "BLIND SPOTS - CHECKS THAT COULD NOT RUN",
          "tone": "critical"
        },
        "children": [
          {
            "type": "Note",
            "props": {
              "text": "A blind spot is NOT an all-clear. A check that could not run tells you nothing, and an empty result reads exactly like a clean one. This panel exists so that difference is visible.",
              "tone": "muted"
            }
          },
          {
            "type": "Repeat",
            "props": {
              "fromPath": "zbook.blindSpots",
              "emptyText": "none - every check ran"
            },
            "children": [
              {
                "type": "Field",
                "props": {
                  "label": "!!",
                  "valuePath": "$item",
                  "tone": "critical"
                }
              }
            ]
          },
          {
            "type": "Note",
            "props": {
              "text": "EVO-X2",
              "tone": "muted"
            }
          },
          {
            "type": "Repeat",
            "props": {
              "fromPath": "evo.blindSpots",
              "emptyText": "none - every check ran"
            },
            "children": [
              {
                "type": "Field",
                "props": {
                  "label": "!!",
                  "valuePath": "$item",
                  "tone": "critical"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "type": "Panel",
    "props": {
      "title": "BRIEFING CONTEXT (ZBOOK)",
      "tone": "info"
    },
    "children": [
      {
        "type": "Repeat",
        "props": {
          "fromPath": "zbook.context",
          "emptyText": "no context lines"
        },
        "children": [
          {
            "type": "Field",
            "props": {
              "label": "-",
              "valuePath": "$item",
              "tone": "muted"
            }
          }
        ]
      }
    ]
  },
  {
    "type": "Row",
    "props": {
      "cols": 4
    },
    "children": [
      {
        "type": "Panel",
        "props": {
          "title": "Sessions"
        },
        "children": [
          {
            "type": "Metric",
            "props": {
              "label": "live / expected",
              "valuePath": "zbook.sections.roster.live"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "expected",
              "valuePath": "zbook.sections.roster.expected"
            }
          }
        ]
      },
      {
        "type": "Panel",
        "props": {
          "title": "Uptime"
        },
        "children": [
          {
            "type": "Metric",
            "props": {
              "label": "hours",
              "valuePath": "zbook.sections.boot.uptimeHours",
              "unit": "h"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "rebooted in window",
              "valuePath": "zbook.sections.boot.rebootedInWindow"
            }
          }
        ]
      },
      {
        "type": "Panel",
        "props": {
          "title": "Tasks"
        },
        "children": [
          {
            "type": "Metric",
            "props": {
              "label": "new failures",
              "valuePath": "zbook.sections.tasks.newFailures"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "managed",
              "valuePath": "zbook.sections.tasks.managed"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "still failing",
              "valuePath": "zbook.sections.tasks.stillFailing"
            }
          }
        ]
      },
      {
        "type": "Panel",
        "props": {
          "title": "Tracker"
        },
        "children": [
          {
            "type": "Metric",
            "props": {
              "label": "open",
              "valuePath": "zbook.sections.tracker.open"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "done",
              "valuePath": "zbook.sections.tracker.done"
            }
          }
        ]
      }
    ]
  },
  {
    "type": "Row",
    "props": {
      "cols": 2
    },
    "children": [
      {
        "type": "Panel",
        "props": {
          "title": "Roster"
        },
        "children": [
          {
            "type": "Table",
            "props": {
              "fromPath": "zbook.sections.roster.sessions",
              "emptyText": "NO SESSIONS - the fleet is down",
              "columns": [
                {
                  "header": "session",
                  "valuePath": "name"
                },
                {
                  "header": "pid",
                  "valuePath": "pid"
                },
                {
                  "header": "up (h)",
                  "valuePath": "upHours"
                }
              ]
            }
          }
        ]
      },
      {
        "type": "Panel",
        "props": {
          "title": "Storage"
        },
        "children": [
          {
            "type": "Table",
            "props": {
              "fromPath": "zbook.sections.disk.drives",
              "emptyText": "no drive data",
              "columns": [
                {
                  "header": "drive",
                  "valuePath": "drive"
                },
                {
                  "header": "free GB",
                  "valuePath": "freeGB"
                },
                {
                  "header": "delta",
                  "valuePath": "deltaGB"
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "type": "Row",
    "props": {
      "cols": 2
    },
    "children": [
      {
        "type": "Panel",
        "props": {
          "title": "Scheduled Tasks"
        },
        "children": [
          {
            "type": "Table",
            "props": {
              "fromPath": "zbook.sections.tasks.detail",
              "emptyText": "no task data",
              "columns": [
                {
                  "header": "task",
                  "valuePath": "name"
                },
                {
                  "header": "state",
                  "valuePath": "state"
                },
                {
                  "header": "result",
                  "valuePath": "result"
                },
                {
                  "header": "healthy",
                  "valuePath": "healthy"
                }
              ]
            }
          }
        ]
      },
      {
        "type": "Panel",
        "props": {
          "title": "Quarantine"
        },
        "children": [
          {
            "type": "Metric",
            "props": {
              "label": "due now",
              "valuePath": "zbook.sections.quarantine.due"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "due soon",
              "valuePath": "zbook.sections.quarantine.soon"
            }
          },
          {
            "type": "Field",
            "props": {
              "label": "folders held",
              "valuePath": "zbook.sections.quarantine.total"
            }
          }
        ]
      }
    ]
  },
  {
    "type": "Panel",
    "props": {
      "title": "EVO-X2 (peer)",
      "tone": "info"
    },
    "children": [
      {
        "type": "Field",
        "props": {
          "label": "reachable",
          "valuePath": "evo.reachable"
        }
      },
      {
        "type": "Field",
        "props": {
          "label": "fetched at",
          "valuePath": "evo.fetchedAt"
        }
      },
      {
        "type": "Field",
        "props": {
          "label": "sessions",
          "valuePath": "evo.sections.roster.live"
        }
      },
      {
        "type": "Field",
        "props": {
          "label": "uptime (h)",
          "valuePath": "evo.sections.boot.uptimeHours"
        }
      },
      {
        "type": "Field",
        "props": {
          "label": "tracker open",
          "valuePath": "evo.sections.tracker.open"
        }
      }
    ]
  },
  {
    "type": "Panel",
    "props": {
      "title": "Watchdog"
    },
    "children": [
      {
        "type": "Field",
        "props": {
          "label": "last sweep",
          "valuePath": "zbook.sections.watchdog.lastSweep"
        }
      },
      {
        "type": "Field",
        "props": {
          "label": "new findings",
          "valuePath": "zbook.sections.watchdog.newFindings"
        }
      },
      {
        "type": "Field",
        "props": {
          "label": "checks",
          "valuePath": "zbook.sections.watchdog.checks"
        }
      },
      {
        "type": "Repeat",
        "props": {
          "fromPath": "zbook.sections.watchdog.recent",
          "emptyText": "no findings this window"
        },
        "children": [
          {
            "type": "Field",
            "props": {
              "label": "finding",
              "valuePath": "$item"
            }
          }
        ]
      }
    ]
  }
];
