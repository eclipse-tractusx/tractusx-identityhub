/********************************************************************************
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { createTheme } from "@mui/material/styles";

const primaryShadow = 'rgba(15, 113, 203, 0.4)';

export const theme = createTheme({
    breakpoints: {
        values: { xs: 0, sm: 375, md: 627, lg: 1056, xl: 1312 },
    },
    palette: {
        primary: {
            main: 'rgb(1,32,96)',
            dark: 'black',
            contrastText: '#fff',
        },
        secondary: {
            main: '#eaf1fe',
            dark: '#d4e3fe',
            contrastText: '#0f71cb',
        },
        success: {
            main: '#00aa55',
        },
        error: {
            main: '#D91E18',
        },
        warning: {
            main: '#ffa602',
        },
        info: {
            main: '#F2F3FB',
            contrastText: '#676BC6',
        },
        text: {
            primary: '#111111',
            secondary: '#252525',
        },
        background: {
            default: '#000000',
            paper: '#000000',
        },
    },
    typography: {
        fontFamily: ['"Manrope"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'].join(','),
        htmlFontSize: 16,
        button: {
            fontSize: 16,
            lineHeight: 24 / 16,
        },
    },
    shape: { borderRadius: 4 },
    components: {
        MuiButtonBase: {
            defaultProps: { disableRipple: true },
            styleOverrides: {
                root: {
                    ':focus': { boxShadow: `0px 0px 0px 3px ${primaryShadow}` },
                    ':active': { boxShadow: `0px 0px 0px 3px ${primaryShadow}` },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 50,
                    boxShadow: 'none',
                    fontSize: 18,
                    padding: '16px 28px',
                    ':hover': { boxShadow: 'none' },
                    ':active, :focus': { boxShadow: `0px 0px 0px 3px ${primaryShadow}` },
                },
                sizeMedium: {
                    padding: '14px 24px',
                },
                sizeSmall: {
                    fontSize: 14,
                    padding: '10px 18px',
                },
                outlined: {
                    borderColor: 'rgb(1,32,96)',
                    borderWidth: 2,
                    padding: '14px 26px',
                    ':hover': {
                        color: 'black',
                        borderColor: 'black',
                        borderWidth: 2,
                        backgroundColor: 'transparent',
                    },
                    ':disabled': {
                        borderColor: '#ADADAD',
                        borderWidth: 2,
                    },
                },
                outlinedSizeMedium: {
                    padding: '12px 22px',
                },
                outlinedSizeSmall: {
                    padding: '8px 16px',
                },
                text: {
                    ':hover': {
                        backgroundColor: '#d4e3fe',
                    },
                },
            },
            variants: [
                {
                    props: { color: 'secondary' },
                    style: {
                        ':hover': { color: 'black' },
                    },
                },
            ],
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    color: 'rgb(1,32,96)',
                    padding: 6,
                    ':hover': {
                        backgroundColor: '#d4e3fe',
                        color: 'black',
                    },
                },
            },
            variants: [
                {
                    props: { color: 'primary' },
                    style: {
                        backgroundColor: 'rgb(1,32,96)',
                        color: '#fff',
                        ':hover': {
                            backgroundColor: 'black',
                            color: '#fff',
                        },
                    },
                },
                {
                    props: { color: 'secondary' },
                    style: {
                        backgroundColor: '#eaf1fe',
                    },
                },
                {
                    props: { size: 'small' },
                    style: {
                        padding: 2,
                    },
                },
            ],
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: '8px' },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    textDecoration: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { borderRadius: '8px' },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 40,
                    overflow: 'hidden',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: 18,
                    padding: 0,
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    padding: 0,
                    justifyContent: 'center',
                    '& .MuiButton-root:not(:first-of-type)': {
                        marginLeft: 24,
                    },
                },
            },
        },
    },
})
