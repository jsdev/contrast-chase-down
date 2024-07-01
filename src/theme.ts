export default {
    components: {
      MuiFormLabel: {
        styleOverrides: {
          root: {
          color: 'inherit',
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
          color: 'inherit !important',
          },
        },
      },
      MuiToggleButtonBase: {
        styleOverrides: {
          root: {
          color: 'inherit',
          },
        },
      },
      MuiFormGroup: {
        styleOverrides: {
            root: {
                display: 'grid',
            },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
        root: {
            marginLeft: '0 !important',
            marginRight: '0 !important'
        },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
          color: 'inherit !important',
          borderColor: 'inherit !important',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: 'inherit !important',
            borderColor: 'inherit !important',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'inherit',
              '&:hover': {
                borderColor: 'inherit !important',
              }
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
          color: 'inherit',
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          markLabel: {
            color: 'inherit',
            backgroundColor: 'rgba(128,228,228,.2)',
            padding: '0 .5em',
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          root: {
          color: 'inherit',
          },
        },
      },
    },
   }