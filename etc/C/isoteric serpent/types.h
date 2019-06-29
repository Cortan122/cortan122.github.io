#ifndef KERNELTYPES_H
#define KERNELTYPES_H

#pragma pack(2)

#define MIN(x,y) ( ((x)<(y)) ? (x) : (y) )
#define MAX(x,y) ( ((x)>(y)) ? (x) : (y) )

#define false 0
#define true 1
#define NULL ((void*)0)

typedef long long int64_t;
typedef int int32_t;
typedef short int16_t;
typedef char int8_t;

typedef unsigned long long uint64_t;
typedef unsigned int uint32_t;
typedef unsigned short uint16_t;
typedef unsigned char uint8_t;

typedef uint8_t bool;

typedef uint32_t uint;
typedef uint32_t addr_t;
typedef uint32_t size_t;

#endif
