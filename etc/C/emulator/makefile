compile: debug run

run: winio.c linio.c io.c exec.c simple.c
	gcc simple.c -o run

debug: winio.c linio.c io.c exec.c shell.c
	gcc shell.c -o debug

clean:
	rm run debug
