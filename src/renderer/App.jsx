import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, IconButton, AppBar, Toolbar, Typography, Container, Paper, Dialog, DialogContent, Slider, ImageList, ImageListItem, LinearProgress, Menu, MenuItem, Switch, FormControlLabel, Tooltip, Fade } from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  FirstPage,
  SwapHoriz,
  FolderOpen,
  TextFields,
  GridView,
  ZoomIn,
  Menu as MenuIcon,
  Settings,
  KeyboardArrowRight,
  KeyboardArrowLeft,
  Close
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
const electron = window.require ? window.require('electron') : require('electron');
const { ipcRenderer } = electron;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const ImageContainer = styled(Box)(({ theme, singlepage }) => ({
  flex: singlepage ? 1 : 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  height: '100%',
  width: singlepage ? '100%' : 'auto',
}));

const ImageWrapper = styled('img')(({ singlepage }) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: singlepage ? 'contain' : 'contain',
  width: singlepage ? '100%' : 'auto',
  height: singlepage ? '100%' : 'auto',
}));

const NavigationOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(18, 18, 18, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  transition: 'opacity 0.3s',
  '&:hover': {
    opacity: 1,
  },
}));

const TopProgressBar = styled(LinearProgress)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 2,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: theme.palette.primary.main,
  },
  zIndex: 9999,
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: 'rgba(18, 18, 18, 0.4)',
  backdropFilter: 'blur(10px)',
  zIndex: 9999,
  '&:hover': {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
}));

const App = () => {
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [rightToLeft, setRightToLeft] = useState(true);
  const [showFilename, setShowFilename] = useState(false);
  const [singlePageMode, setSinglePageMode] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showImageList, setShowImageList] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [hasPageTurned, setHasPageTurned] = useState(false);
  const [menuButtonClicked, setMenuButtonClicked] = useState(false);

  useEffect(() => {
    if (currentPage >= 0) {
      if (!hasPageTurned) {
        setHasPageTurned(true);
        setControlsVisible(false);
      } else if (menuButtonClicked && !controlsVisible) {
        setMenuButtonClicked(false);
      }
    }
  }, [currentPage, hasPageTurned, menuButtonClicked, controlsVisible]);

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const toggleControls = () => {
    setControlsVisible(true);
    setMenuButtonClicked(true);
  };

  const handleFolderSelect = async () => {
    const folder = await ipcRenderer.invoke('select-folder');
    if (folder) {
      setFolderPath(folder);
      const imageFiles = await ipcRenderer.invoke('get-images', folder);
      setImages(imageFiles);
      setCurrentPage(0);
    }
  };

  const totalPages = singlePageMode ? images.length : Math.ceil(images.length / 2);
  const progress = (currentPage + 1) / totalPages * 100;

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handleFirstPage = () => {
    setCurrentPage(0);
  };

  const handleImageClick = (index) => {
    setCurrentPage(Math.floor(index / 2));
    setShowImageList(false);
  };

  const getCurrentImages = () => {
    if (singlePageMode) {
      return {
        left: images[currentPage],
        right: null
      };
    }
    const idx = currentPage * 2;
    const leftIdx = rightToLeft ? idx + 1 : idx;
    const rightIdx = rightToLeft ? idx : idx + 1;
    return {
      left: images[leftIdx],
      right: images[rightIdx],
    };
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          rightToLeft ? handleNextPage() : handlePrevPage();
          break;
        case 'ArrowRight':
          rightToLeft ? handlePrevPage() : handleNextPage();
          break;
        case 'Home':
          handleFirstPage();
          break;
        case ' ':
        case 'ArrowDown':
          handleNextPage();
          break;
        case 'ArrowUp':
          handlePrevPage();
          break;
        case 'g':
          setShowImageList(prev => !prev);
          break;
      }
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      for (const item of e.dataTransfer.items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry.isDirectory) {
            const folder = e.dataTransfer.files[0].path;
            setFolderPath(folder);
            const imageFiles = await ipcRenderer.invoke('get-images', folder);
            setImages(imageFiles);
            setCurrentPage(0);
            break;
          }
        }
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [currentPage, rightToLeft, handleNextPage, handlePrevPage]);

  const { left, right } = getCurrentImages();

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: 'background.default',
    }}>
      {images.length > 0 && (
        <TopProgressBar variant="determinate" value={progress} />
      )}
      
      <StyledAppBar 
        position="fixed" 
        sx={{ 
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.5s',
          mt: images.length > 0 ? '2px' : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          visibility: controlsVisible ? 'visible' : 'hidden',
        }}
      >
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {folderPath ? folderPath.split('\\').pop() : 'TwoPage Viewer'}
          </Typography>
          <Button
            startIcon={<FolderOpen />}
            onClick={handleFolderSelect}
            color="inherit"
            size="small"
          >
            フォルダを開く
          </Button>
          <IconButton onClick={() => setShowImageList(true)} color="inherit" size="small">
            <GridView />
          </IconButton>
          <IconButton onClick={handleSettingsClick} color="inherit" size="small">
            <Settings />
          </IconButton>
          <Tooltip title="メニューを閉じる">
            <IconButton onClick={() => setControlsVisible(false)} color="inherit" size="small">
              <Close />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </StyledAppBar>

      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={rightToLeft}
                onChange={(e) => setRightToLeft(e.target.checked)}
              />
            }
            label="右開き"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={showFilename}
                onChange={(e) => setShowFilename(e.target.checked)}
              />
            }
            label="ファイル名を表示"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={singlePageMode}
                onChange={(e) => {
                  setSinglePageMode(e.target.checked);
                  setCurrentPage(Math.floor(currentPage * (e.target.checked ? 2 : 0.5)));
                }}
              />
            }
            label="単ページ表示"
          />
        </MenuItem>
      </Menu>

      <MenuButton
        onClick={toggleControls}
        size="small"
        sx={{
          opacity: (!controlsVisible) ? 1 : 0,
          transition: 'opacity 0.3s',
          visibility: (!controlsVisible) ? 'visible' : 'hidden',
          pointerEvents: (!controlsVisible) ? 'auto' : 'none',
        }}
      >
        <Tooltip title="メニューを表示">
          <MenuIcon />
        </Tooltip>
      </MenuButton>

      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        mt: controlsVisible ? '50px' : '2px',
        transition: 'margin-top 0.5s',
        overflow: 'hidden',
        justifyContent: singlePageMode ? 'center' : 'space-between',
        alignItems: 'center',
      }}>
        {images.length > 0 ? (
          <>
            <ImageContainer singlepage={singlePageMode ? 1 : 0}>
              {left && (
                <>
                  <ImageWrapper 
                    src={left} 
                    alt="Left page" 
                    singlepage={singlePageMode ? 1 : 0}
                    onLoad={(e) => {
                      if (singlePageMode) {
                        const img = e.target;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const containerAspectRatio = window.innerWidth / window.innerHeight;
                        
                        if (aspectRatio > containerAspectRatio) {
                          // 横長画像の場合
                          img.style.width = '100%';
                          img.style.height = 'auto';
                        } else {
                          // 縦長画像の場合
                          img.style.width = 'auto';
                          img.style.height = '100%';
                        }
                      }
                    }}
                  />
                  {showFilename && (
                    <Typography
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '4px 8px',
                        borderRadius: 1,
                      }}
                    >
                      {left.split('\\').pop()}
                    </Typography>
                  )}
                </>
              )}
            </ImageContainer>
            {!singlePageMode && (
              <ImageContainer>
                {right && (
                  <>
                    <ImageWrapper src={right} alt="Right page" />
                    {showFilename && (
                      <Typography
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          padding: '4px 8px',
                          borderRadius: 1,
                        }}
                      >
                        {right.split('\\').pop()}
                      </Typography>
                    )}
                  </>
                )}
              </ImageContainer>
            )}

            <NavigationOverlay
              sx={{ 
                opacity: controlsVisible ? 1 : 0,
                pointerEvents: controlsVisible ? 'auto' : 'none',
              }}
            >
              <IconButton onClick={handleFirstPage} disabled={currentPage === 0} size="small" color="inherit">
                <FirstPage />
              </IconButton>
              <IconButton onClick={handlePrevPage} disabled={currentPage === 0} size="small" color="inherit">
                {rightToLeft ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              </IconButton>
              <Typography variant="body2" sx={{ mx: 1 }}>
                {currentPage + 1} / {totalPages}
              </Typography>
              <IconButton onClick={handleNextPage} disabled={currentPage === totalPages - 1} size="small" color="inherit">
                {rightToLeft ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
              </IconButton>
            </NavigationOverlay>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="h5" color="text.secondary">
              画像フォルダを選択してください
            </Typography>
            <Button
              startIcon={<FolderOpen />}
              onClick={handleFolderSelect}
              variant="contained"
              size="large"
            >
              フォルダを開く
            </Button>
          </Box>
        )}
      </Box>

      <Dialog 
        fullScreen 
        open={showImageList} 
        onClose={() => setShowImageList(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'background.default',
            backgroundImage: 'none',
          }
        }}
      >
        <AppBar position="static" color="default">
          <Toolbar variant="dense">
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              画像一覧
            </Typography>
            <Box sx={{ width: 200, mr: 2, display: 'flex', alignItems: 'center' }}>
              <ZoomIn sx={{ mr: 1 }} />
              <Slider
                value={gridCols}
                min={2}
                max={8}
                onChange={(e, newValue) => setGridCols(newValue)}
                aria-label="Grid columns"
              />
            </Box>
            <Button color="inherit" onClick={() => setShowImageList(false)}>
              閉じる
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <ImageList cols={gridCols} gap={8}>
            {images.map((img, index) => (
              <ImageListItem 
                key={img} 
                onClick={() => handleImageClick(index)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  }
                }}
              >
                <img
                  src={img}
                  alt={`Page ${index + 1}`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
                {showFilename && (
                  <Typography
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    {img.split('\\').pop()}
                  </Typography>
                )}
              </ImageListItem>
            ))}
          </ImageList>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default App; 