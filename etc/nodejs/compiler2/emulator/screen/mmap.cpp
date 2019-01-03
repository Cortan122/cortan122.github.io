#include <stdint.h>
#include <stdio.h>

static const int size = 0x10000;

#if defined(_WIN32) || defined(WIN32)

#include <windows.h>

static HANDLE GetMappedMemoryPointer_hMapFile;
static uint8_t* GetMappedMemoryPointer_buffer;

uint8_t* GetMappedMemoryPointer(){
  HANDLE hMapFile = OpenFileMapping(
    FILE_MAP_ALL_ACCESS,   // read/write access
    FALSE,                 // do not inherit the name
    TEXT("Local\\MyFileMappingObject")
  );
  if(hMapFile == NULL)printf("ho hMapFile (%d)\n",GetLastError());

  uint8_t* buffer = (uint8_t*)MapViewOfFile(
    hMapFile,   // handle to map object
    FILE_MAP_ALL_ACCESS, // read/write permission
    0,
    0,
    size
  );
  if(buffer == NULL)printf("ho buffer (%d)\n",GetLastError());
  GetMappedMemoryPointer_buffer = buffer;
  GetMappedMemoryPointer_hMapFile = hMapFile;
  return buffer;
}

void FreeMappedMemory(){
  UnmapViewOfFile(GetMappedMemoryPointer_buffer);
  CloseHandle(GetMappedMemoryPointer_hMapFile);
}

#else

#include <fcntl.h>
#include <sys/stat.h>
#include <sys/mman.h>

static int GetMappedMemoryPointer_memFd;
static void* GetMappedMemoryPointer_buffer;
static const char* GetMappedMemoryPointer_memname = "example_memory";

uint8_t* GetMappedMemoryPointer(){
  int memFd = shm_open(GetMappedMemoryPointer_memname, O_RDONLY, 0);//todo:fix O_RDONLY
  if(memFd == -1){
    perror("Can't open file");
    return NULL;
  }

  void *buffer = mmap(NULL, size, PROT_READ, MAP_SHARED, memFd, 0);
  if(buffer == NULL){
    perror("Can't mmap");
    return NULL;
  }

  GetMappedMemoryPointer_memFd = memFd;
  GetMappedMemoryPointer_buffer = buffer;
  return (uint8_t*)buffer; 
}

void FreeMappedMemory(){
  munmap(GetMappedMemoryPointer_buffer,size);
  shm_unlink(GetMappedMemoryPointer_memname);
}

#endif
