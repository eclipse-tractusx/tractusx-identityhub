/********************************************************************************
 * Eclipse Tractus-X - Identity Hub Frontend
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

export const cardSx = {
    bgcolor: 'rgb(0,0,0)',
    border: '2px solid rgba(1,86,255,0.26)',
    borderRadius: '8px',
    boxShadow: '0 0 12px rgb(1,40,119)',
    color: 'rgb(248,249,250)',
    transition: 'border-color 0.3s ease',
    '&:hover': {
        borderColor: 'rgba(15,113,203,0.85)',
    },
};

export const dialogPaperProps = {
    sx: {
        bgcolor: 'rgb(0,0,0)',
        color: 'rgb(248,249,250)',
        border: '2px solid rgba(1,86,255,0.26)',
        borderRadius: '8px',
        boxShadow: '0 0 12px rgb(1,40,119)',
    },
};

export const textFieldSx = {
    '& .MuiOutlinedInput-root': {
        color: 'rgb(248,249,250)',
        '& fieldset': { borderColor: 'rgba(1,86,255,0.26)' },
        '&:hover fieldset': { borderColor: 'rgba(15,113,203,0.85)' },
        '&.Mui-focused fieldset': { borderColor: 'rgba(15,113,203,1)' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(248,249,250,0.7)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'rgb(15,113,203)' },
};

export const accentColors = {
    brandLightBlue: 'rgb(15,113,203)',
    brandText: 'rgb(248,249,250)',
    brandTextMuted: 'rgba(248,249,250,0.7)',
    brandBorder: 'rgba(1,86,255,0.26)',
    brandBlue: 'rgb(1,40,119)',
    brandOrange: 'rgb(250,160,35)',
    brandDarkGray: 'rgba(35,35,38,0.76)',
    brandPrimary: 'rgb(1,32,96)',
};

export const jsonPreSx = {
    background: 'linear-gradient(0deg, rgba(200,200,200,0.2), rgba(236,236,236,0.4))',
    color: 'rgb(248,249,250)',
    p: 2,
    borderRadius: 0,
    overflow: 'auto',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
};

export const selectSx = {
    color: 'rgb(248,249,250)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(1,86,255,0.26)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(15,113,203,0.85)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(15,113,203,1)' },
    '& .MuiSvgIcon-root': { color: 'rgba(248,249,250,0.7)' },
};

export const menuItemSx = {
    bgcolor: 'rgb(0,0,0)',
    color: 'rgb(248,249,250)',
    '&:hover': { bgcolor: 'rgba(1,32,96,0.5)' },
    '&.Mui-selected': { bgcolor: 'rgba(1,32,96,0.7)' },
    '&.Mui-selected:hover': { bgcolor: 'rgba(1,32,96,0.8)' },
};

export const menuPaperProps = {
    sx: {
        bgcolor: 'rgb(0,0,0)',
        border: '2px solid rgba(1,86,255,0.26)',
        boxShadow: '0 0 12px rgb(1,40,119)',
    },
};

export const emptyStateSx = {
    textAlign: 'center',
    py: 8,
    px: 4,
    border: '2px dashed rgba(1,86,255,0.26)',
    borderRadius: '8px',
};

export const chipTransparentBg = (color: string) => ({
    bgcolor: 'transparent',
    color,
    border: `1px solid ${color}`,
    fontWeight: 600,
    fontSize: '0.7rem',
    borderRadius: '4px',
    height: '32px',
});

export const whiteDialogPaperProps = {
    sx: {
        backgroundColor: '#fff',
        '& .MuiDialogContent-root': {
            backgroundColor: '#fff',
        },
    },
};

export const coloredDialogTitleSx = {
    m: 0,
    p: 3,
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    fontSize: '1.25rem',
    fontWeight: 600,
    position: 'relative' as const,
};

export const dialogCloseButtonSx = {
    position: 'absolute',
    right: 21,
    top: 21,
    zIndex: 1,
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
};

export const whiteDialogContentSx = {
    p: 3,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    pt: '24px !important',
    '& .MuiTextField-root': {
        backgroundColor: '#fff',
        '& .MuiOutlinedInput-root': {
            backgroundColor: '#fff',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'primary.main' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
        },
        '& .MuiInputLabel-root': {
            backgroundColor: '#fff',
            padding: '0 8px',
            '&.Mui-focused': { color: 'primary.main' },
            '&.MuiInputLabel-shrink': {
                backgroundColor: '#fff',
                padding: '0 8px',
                transform: 'translate(14px, -9px) scale(0.75)',
            },
        },
    },
};

export const whiteDialogActionsSx = {
    p: 3,
    backgroundColor: '#fff',
    borderTop: '1px solid',
    borderColor: 'divider',
};

export const dialogCancelBtnSx = {
    minWidth: '100px',
    textTransform: 'none' as const,
    fontWeight: 500,
};

export const dialogSubmitBtnSx = {
    minWidth: '100px',
    textTransform: 'none' as const,
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};
